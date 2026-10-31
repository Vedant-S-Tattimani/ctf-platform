import type { Request, Response } from 'express';
import { getCurrentEvent } from './events.service.js';

export async function currentEventHandler(_req: Request, res: Response) {
  const now = new Date();
  res.json({ event: await getCurrentEvent(now), serverTime: now.toISOString() });
}
