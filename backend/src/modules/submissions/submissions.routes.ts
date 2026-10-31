import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { submitLimiter } from '../../middleware/rateLimit.js';
import { validateBody } from '../../middleware/validate.js';
import { mySubmissionsHandler, submitFlagHandler } from './submissions.controller.js';
import { submitFlagSchema } from './submissions.schema.js';

export const submissionsRouter = Router();

submissionsRouter.post('/', requireAuth, submitLimiter, validateBody(submitFlagSchema), asyncHandler(submitFlagHandler));
submissionsRouter.get('/me', requireAuth, asyncHandler(mySubmissionsHandler));
