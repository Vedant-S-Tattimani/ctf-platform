import type { User } from '@prisma/client';
import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { signToken, tokenMaxAgeMs } from '../../utils/jwt.js';
import {
  forgotPassword,
  login,
  register,
  resendVerification,
  resetPassword,
  toSelfUser,
  verifyEmail,
} from './auth.service.js';

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: tokenMaxAgeMs(),
  };
}

export function setAuthCookie(res: Response, user: Pick<User, 'id' | 'role' | 'sessionVersion'>): void {
  res.cookie(
    env.COOKIE_NAME,
    signToken({ sub: user.id, role: user.role, sv: user.sessionVersion }),
    cookieOptions(),
  );
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

export async function registerHandler(req: Request, res: Response) {
  const user = await register(req.body);
  setAuthCookie(res, user);
  res.status(201).json({ user: toSelfUser(user) });
}

export async function loginHandler(req: Request, res: Response) {
  const user = await login(req.body);
  setAuthCookie(res, user);
  res.json({ user: toSelfUser(user) });
}

export function logoutHandler(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export function meHandler(req: Request, res: Response) {
  res.json({ user: toSelfUser(req.user!) });
}

export function sessionHandler(req: Request, res: Response) {
  res.json({ user: req.user ? toSelfUser(req.user) : null });
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await forgotPassword(req.body.email);
  res.json({ ok: true, message: 'If that email is registered, a reset link is on its way.' });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await resetPassword(req.body.token, req.body.password);
  res.json({ ok: true });
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const user = await verifyEmail(req.body.token);
  res.json({ ok: true, user: toSelfUser(user) });
}

export async function resendVerificationHandler(req: Request, res: Response) {
  res.json(await resendVerification(req.user!));
}
