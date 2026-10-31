import type { User } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import {
  hashOpaqueToken,
  hashPassword,
  newOpaqueToken,
  verifyPassword,
} from '../../utils/hash.js';
import { sendMail } from '../../utils/mail.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

export interface PublicUser {
  id: string;
  username: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  teamId: string | null;
  createdAt: string;
}

export interface SelfUser extends PublicUser {
  email: string;
  emailVerifiedAt: string | null;
}

/** Safe to expose to anonymous visitors: never includes the email address. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    teamId: user.teamId,
    createdAt: user.createdAt.toISOString(),
  };
}

/** For the authenticated user's own payloads only. */
export function toSelfUser(user: User): SelfUser {
  return {
    ...toPublicUser(user),
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}

type TokenType = 'verify' | 'reset';

const TOKEN_TTL_MS: Record<TokenType, number> = {
  verify: 24 * 60 * 60 * 1000,
  reset: 60 * 60 * 1000,
};

async function issueToken(userId: string, type: TokenType): Promise<string> {
  const token = newOpaqueToken();
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
    },
  });
  return token;
}

async function findValidToken(token: string, type: TokenType) {
  const record = await prisma.authToken.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
  });
  if (!record || record.type !== type || record.usedAt) return null;
  if (record.expiresAt.getTime() <= Date.now()) return null;
  return record;
}

function linkFor(type: TokenType, token: string): string {
  const path = type === 'reset' ? '/reset-password' : '/verify-email';
  return `${env.APP_BASE_URL}${path}?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail(user: User): Promise<void> {
  if (user.emailVerifiedAt) return;
  const token = await issueToken(user.id, 'verify');
  await sendMail({
    to: user.email,
    subject: 'Verify your YourCTF email',
    text: `Confirm your email address: ${linkFor('verify', token)}\nThis link expires in 24 hours.`,
  });
}

export async function sendPasswordResetEmail(user: User): Promise<void> {
  const token = await issueToken(user.id, 'reset');
  await sendMail({
    to: user.email,
    subject: 'Reset your YourCTF password',
    text: `Reset your password: ${linkFor('reset', token)}\nThis link expires in 60 minutes. If you did not ask for this, ignore this email.`,
  });
}

export async function register(input: RegisterInput): Promise<User> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: input.username }] },
  });
  if (existing) {
    throw new HttpError(409, existing.email === email ? 'Email already registered' : 'Username taken');
  }

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email,
      passwordHash: await hashPassword(input.password),
    },
  });
  await sendVerificationEmail(user);
  return user;
}

export async function login(input: LoginInput): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  const ok = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !ok) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return user;
}

/** Always resolves so the endpoint cannot be used to enumerate accounts. */
export async function forgotPassword(emailRaw: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: emailRaw.toLowerCase() } });
  if (!user) return;
  await sendPasswordResetEmail(user);
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const record = await findValidToken(token, 'reset');
  if (!record) throw new HttpError(400, 'This reset link is invalid or has expired');

  const passwordHash = await hashPassword(password);
  const now = new Date();

  await prisma.$transaction([
    prisma.authToken.update({ where: { id: record.id }, data: { usedAt: now } }),
    // Any other outstanding reset links become useless too.
    prisma.authToken.updateMany({
      where: { userId: record.userId, type: 'reset', usedAt: null },
      data: { usedAt: now },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
  ]);
}

export async function verifyEmail(token: string): Promise<User> {
  const record = await findValidToken(token, 'verify');
  if (!record) throw new HttpError(400, 'This verification link is invalid or has expired');

  const now = new Date();
  await prisma.$transaction([
    prisma.authToken.update({ where: { id: record.id }, data: { usedAt: now } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: now } }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) throw new HttpError(404, 'Account no longer exists');
  return user;
}

export async function resendVerification(user: User): Promise<{ alreadyVerified: boolean }> {
  if (user.emailVerifiedAt) return { alreadyVerified: true };
  await sendVerificationEmail(user);
  return { alreadyVerified: false };
}
