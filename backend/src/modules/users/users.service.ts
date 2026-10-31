import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import {
  toPublicUser,
  toSelfUser,
  type PublicUser,
  type SelfUser,
} from '../auth/auth.service.js';
import type { UpdateMeInput } from './users.schema.js';

export interface PublicProfile extends PublicUser {
  teamName: string | null;
}

export interface SelfProfile extends PublicProfile {
  email: string;
}

export async function getProfile(userId: string): Promise<PublicProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { team: { select: { name: true } } },
  });
  if (!user) throw new HttpError(404, 'User not found');
  return { ...toPublicUser(user), teamName: user.team?.name ?? null };
}

export async function getSelfProfile(userId: string): Promise<SelfProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { team: { select: { name: true } } },
  });
  if (!user) throw new HttpError(404, 'User not found');
  return { ...toSelfUser(user), teamName: user.team?.name ?? null };
}

export async function updateMe(userId: string, input: UpdateMeInput): Promise<SelfUser> {
  const user = await prisma.user.update({ where: { id: userId }, data: { ...input } });
  return toSelfUser(user);
}
