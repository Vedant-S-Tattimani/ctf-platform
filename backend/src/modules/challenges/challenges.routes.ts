import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import {
  challengeHandler,
  listChallengesHandler,
  unlockHintHandler,
} from './challenges.controller.js';
import {
  challengeIdParamsSchema,
  listChallengesQuerySchema,
  unlockHintParamsSchema,
} from './challenges.schema.js';

export const challengesRouter = Router();

challengesRouter.get(
  '/',
  optionalAuth,
  validateQuery(listChallengesQuerySchema),
  asyncHandler(listChallengesHandler),
);
challengesRouter.get(
  '/:id',
  optionalAuth,
  validateParams(challengeIdParamsSchema),
  asyncHandler(challengeHandler),
);
challengesRouter.post(
  '/:id/hints/:hintId/unlock',
  requireAuth,
  validateParams(unlockHintParamsSchema),
  asyncHandler(unlockHintHandler),
);
