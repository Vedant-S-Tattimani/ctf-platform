import type { Request, Response } from 'express';
import { storeAsset } from '../files/files.service.js';
import * as admin from './admin.service.js';

const id = (req: Request) => req.params.id as string;
const list = (req: Request) => req.query as unknown as { limit: number; offset: number };

export const listChallengesHandler = async (_req: Request, res: Response) =>
  res.json({ challenges: await admin.listChallenges() });
export const getChallengeHandler = async (req: Request, res: Response) =>
  res.json({ challenge: await admin.getChallenge(id(req)) });
export const createChallengeHandler = async (req: Request, res: Response) =>
  res.status(201).json({ challenge: await admin.createChallenge(req.body) });
export const updateChallengeHandler = async (req: Request, res: Response) =>
  res.json({ challenge: await admin.updateChallenge(id(req), req.body) });
export const deleteChallengeHandler = async (req: Request, res: Response) =>
  res.json(await admin.deleteChallenge(id(req)));
export const addFlagHandler = async (req: Request, res: Response) =>
  res.status(201).json({ flag: await admin.addFlag(id(req), req.body) });
export const deleteFlagHandler = async (req: Request, res: Response) =>
  res.json(await admin.deleteFlag(id(req)));
export const addHintHandler = async (req: Request, res: Response) =>
  res.status(201).json({ hint: await admin.addHint(id(req), req.body) });
export const deleteHintHandler = async (req: Request, res: Response) =>
  res.json(await admin.deleteHint(id(req)));
export const addFileHandler = async (req: Request, res: Response) =>
  res.status(201).json({ file: await admin.addFile(id(req), req.body) });
export const deleteFileHandler = async (req: Request, res: Response) =>
  res.json(await admin.deleteFile(id(req)));

export const uploadFileHandler = async (req: Request, res: Response) => {
  const nameHeader = req.headers['x-file-name'];
  const mimeHeader = req.headers['content-type'];
  const asset = await storeAsset(
    req.body,
    typeof nameHeader === 'string' ? nameHeader : '',
    typeof mimeHeader === 'string' ? mimeHeader : '',
  );
  res.status(201).json({ asset });
};

export const listCategoriesHandler = async (_req: Request, res: Response) =>
  res.json({ categories: await admin.listCategories() });
export const createCategoryHandler = async (req: Request, res: Response) =>
  res.status(201).json({ category: await admin.createCategory(req.body) });
export const updateCategoryHandler = async (req: Request, res: Response) =>
  res.json({ category: await admin.updateCategory(id(req), req.body) });
export const deleteCategoryHandler = async (req: Request, res: Response) =>
  res.json(await admin.deleteCategory(id(req)));

export const listEventsHandler = async (_req: Request, res: Response) =>
  res.json({ events: await admin.listEvents() });
export const createEventHandler = async (req: Request, res: Response) =>
  res.status(201).json({ event: await admin.createEvent(req.body) });
export const updateEventHandler = async (req: Request, res: Response) =>
  res.json({ event: await admin.updateEvent(id(req), req.body) });

export const listUsersHandler = async (req: Request, res: Response) =>
  res.json(await admin.listUsers(list(req)));
export const listTeamsHandler = async (req: Request, res: Response) =>
  res.json(await admin.listTeams(list(req)));
export const listSubmissionsHandler = async (req: Request, res: Response) =>
  res.json(await admin.listSubmissions(list(req)));
