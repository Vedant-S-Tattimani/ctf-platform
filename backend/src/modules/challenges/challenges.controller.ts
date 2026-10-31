import type { Request, Response } from 'express';
import { getChallenge, listChallenges, unlockHint } from './challenges.service.js';
import type { ListChallengesQuery } from './challenges.schema.js';

export async function listChallengesHandler(req: Request, res: Response) {
  res.json({
    challenges: await listChallenges(req.query as unknown as ListChallengesQuery, req.user ?? null),
  });
}

export async function challengeHandler(req: Request, res: Response) {
  res.json({ challenge: await getChallenge(req.params.id as string, req.user ?? null) });
}

export async function unlockHintHandler(req: Request, res: Response) {
  res.json(
    await unlockHint(req.user!, req.params.id as string, req.params.hintId as string),
  );
}
