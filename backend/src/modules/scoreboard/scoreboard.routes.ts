import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validateQuery } from '../../middleware/validate.js';
import { scoreboardHandler, scoreboardHistoryHandler } from './scoreboard.controller.js';
import { scoreboardQuerySchema } from './scoreboard.schema.js';

export const scoreboardRouter = Router();

scoreboardRouter.get('/', validateQuery(scoreboardQuerySchema), asyncHandler(scoreboardHandler));
scoreboardRouter.get(
  '/history',
  validateQuery(scoreboardQuerySchema),
  asyncHandler(scoreboardHistoryHandler),
);
