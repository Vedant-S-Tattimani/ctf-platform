import type { Request, Response } from 'express';
import type { ScoreboardQuery } from './scoreboard.schema.js';
import { listScoreboard, scoreboardHistory } from './scoreboard.service.js';

function query(req: Request): ScoreboardQuery {
  return req.query as unknown as ScoreboardQuery;
}

export async function scoreboardHandler(req: Request, res: Response) {
  res.json({ entries: await listScoreboard(query(req)) });
}

export async function scoreboardHistoryHandler(req: Request, res: Response) {
  res.json({ series: await scoreboardHistory(query(req)) });
}
