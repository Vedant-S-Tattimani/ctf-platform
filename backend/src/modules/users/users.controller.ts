import type { Request, Response } from 'express';
import { getProfile, getSelfProfile, updateMe } from './users.service.js';

export async function profileHandler(req: Request, res: Response) {
  res.json({ user: await getProfile(req.params.id as string) });
}

export async function meProfileHandler(req: Request, res: Response) {
  res.json({ user: await getSelfProfile(req.user!.id) });
}

export async function updateMeHandler(req: Request, res: Response) {
  res.json({ user: await updateMe(req.user!.id, req.body) });
}
