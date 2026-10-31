import type { Request, Response } from 'express';
import {
  createTeam,
  getMyTeam,
  getTeam,
  joinTeam,
  leaveTeam,
  regenerateInviteCode,
  removeMember,
  transferOwnership,
  updateTeam,
} from './teams.service.js';

export async function createTeamHandler(req: Request, res: Response) {
  res.status(201).json({ team: await createTeam(req.user!, req.body) });
}

export async function joinTeamHandler(req: Request, res: Response) {
  res.json({ team: await joinTeam(req.user!, req.body) });
}

export async function leaveTeamHandler(req: Request, res: Response) {
  res.json(await leaveTeam(req.user!));
}

export async function updateTeamHandler(req: Request, res: Response) {
  res.json({ team: await updateTeam(req.user!, req.body) });
}

export async function myTeamHandler(req: Request, res: Response) {
  res.json({ team: await getMyTeam(req.user!) });
}

export async function removeMemberHandler(req: Request, res: Response) {
  res.json({ team: await removeMember(req.user!, req.params.userId as string) });
}

export async function transferOwnershipHandler(req: Request, res: Response) {
  res.json({ team: await transferOwnership(req.user!, req.body.userId) });
}

export async function regenerateInviteCodeHandler(req: Request, res: Response) {
  res.json({ team: await regenerateInviteCode(req.user!) });
}

export async function teamHandler(req: Request, res: Response) {
  res.json({ team: await getTeam(req.params.id as string) });
}
