import { randomBytes } from 'node:crypto';
import type { Team, User } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { toPublicUser, type PublicUser } from '../auth/auth.service.js';
import type { CreateTeamInput, JoinTeamInput, UpdateTeamInput } from './teams.schema.js';

export interface TeamDto {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  maxSize: number;
  /** Only revealed to team members; null on public team lookups. */
  inviteCode: string | null;
  ownerId: string;
  createdAt: string;
  memberCount: number;
  members: PublicUser[];
}

function newInviteCode(): string {
  return randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, 'X');
}

async function toTeamDto(team: Team, members: User[], revealInviteCode: boolean): Promise<TeamDto> {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    avatarUrl: team.avatarUrl,
    maxSize: team.maxSize,
    inviteCode: revealInviteCode ? team.inviteCode : null,
    ownerId: team.ownerId,
    createdAt: team.createdAt.toISOString(),
    memberCount: members.length,
    members: members.map(toPublicUser),
  };
}

async function loadTeam(teamId: string, revealInviteCode = true): Promise<TeamDto> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) throw new HttpError(404, 'Team not found');
  const { members, ...rest } = team;
  return toTeamDto(rest, members, revealInviteCode);
}

export async function createTeam(user: User, input: CreateTeamInput): Promise<TeamDto> {
  if (user.teamId) throw new HttpError(409, 'Leave your current team first');

  const nameTaken = await prisma.team.findUnique({ where: { name: input.name } });
  if (nameTaken) throw new HttpError(409, 'Team name taken');

  let inviteCode = newInviteCode();
  while (await prisma.team.findUnique({ where: { inviteCode } })) {
    inviteCode = newInviteCode();
  }

  const team = await prisma.$transaction(async (tx) => {
    const created = await tx.team.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        inviteCode,
        ownerId: user.id,
      },
    });
    await tx.user.update({ where: { id: user.id }, data: { teamId: created.id } });
    return created;
  });

  return loadTeam(team.id);
}

export async function joinTeam(user: User, input: JoinTeamInput): Promise<TeamDto> {
  if (user.teamId) throw new HttpError(409, 'Leave your current team first');

  const team = await prisma.team.findUnique({
    where: { inviteCode: input.inviteCode.toUpperCase() },
  });
  if (!team) throw new HttpError(404, 'Unknown invite code');

  const memberCount = await prisma.user.count({ where: { teamId: team.id } });
  if (memberCount >= team.maxSize) throw new HttpError(409, 'Team is full');

  await prisma.user.update({ where: { id: user.id }, data: { teamId: team.id } });
  return loadTeam(team.id);
}

export async function leaveTeam(user: User): Promise<{ ok: true; deleted: boolean }> {
  if (!user.teamId) throw new HttpError(404, 'You are not in a team');
  const teamId = user.teamId;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new HttpError(404, 'Team not found');

  if (team.ownerId === user.id) {
    const memberCount = await prisma.user.count({ where: { teamId } });
    if (memberCount > 1) {
      throw new HttpError(409, 'Owner cannot leave while the team has other members');
    }
    await prisma.team.delete({ where: { id: teamId } });
    return { ok: true, deleted: true };
  }

  await prisma.user.update({ where: { id: user.id }, data: { teamId: null } });
  return { ok: true, deleted: false };
}

async function ownedTeam(user: User) {
  if (!user.teamId) throw new HttpError(404, 'You are not in a team');
  const team = await prisma.team.findUnique({ where: { id: user.teamId } });
  if (!team) throw new HttpError(404, 'Team not found');
  if (team.ownerId !== user.id) throw new HttpError(403, 'Only the team owner can do that');
  return team;
}

export async function updateTeam(user: User, input: UpdateTeamInput): Promise<TeamDto> {
  const team = await ownedTeam(user);

  if (input.name && input.name !== team.name) {
    const taken = await prisma.team.findUnique({ where: { name: input.name } });
    if (taken) throw new HttpError(409, 'Team name taken');
  }

  await prisma.team.update({ where: { id: team.id }, data: { ...input } });
  return loadTeam(team.id);
}

export async function removeMember(owner: User, memberId: string): Promise<TeamDto> {
  const team = await ownedTeam(owner);
  if (memberId === owner.id) throw new HttpError(400, 'The owner cannot be removed from the team');

  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member || member.teamId !== team.id) {
    throw new HttpError(404, 'That player is not on your team');
  }

  await prisma.user.update({ where: { id: memberId }, data: { teamId: null } });
  return loadTeam(team.id);
}

export async function transferOwnership(owner: User, memberId: string): Promise<TeamDto> {
  const team = await ownedTeam(owner);
  if (memberId === owner.id) throw new HttpError(400, 'You already own this team');

  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member || member.teamId !== team.id) {
    throw new HttpError(404, 'That player is not on your team');
  }

  await prisma.team.update({ where: { id: team.id }, data: { ownerId: memberId } });
  return loadTeam(team.id);
}

export async function regenerateInviteCode(owner: User): Promise<TeamDto> {
  const team = await ownedTeam(owner);

  let inviteCode = newInviteCode();
  while (await prisma.team.findUnique({ where: { inviteCode } })) {
    inviteCode = newInviteCode();
  }

  await prisma.team.update({ where: { id: team.id }, data: { inviteCode } });
  return loadTeam(team.id);
}

export function getTeam(teamId: string): Promise<TeamDto> {
  return loadTeam(teamId, false);
}

export async function getMyTeam(user: User): Promise<TeamDto | null> {
  if (!user.teamId) return null;
  return loadTeam(user.teamId);
}
