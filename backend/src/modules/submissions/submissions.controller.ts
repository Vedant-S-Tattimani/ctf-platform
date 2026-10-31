import type { Request, Response } from 'express';
import { mySubmissions, submitFlag } from './submissions.service.js';

export async function submitFlagHandler(req: Request, res: Response) {
  const result = await submitFlag(req.user!, req.body);
  if (result.duplicate) {
    res.status(409).json(result);
    return;
  }
  res.json(result);
}

export async function mySubmissionsHandler(req: Request, res: Response) {
  res.json({ submissions: await mySubmissions(req.user!) });
}
