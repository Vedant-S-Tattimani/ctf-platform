import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { meProfileHandler, profileHandler, updateMeHandler } from './users.controller.js';
import { updateMeSchema, userIdParamsSchema } from './users.schema.js';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, asyncHandler(meProfileHandler));
usersRouter.patch('/me', requireAuth, validateBody(updateMeSchema), asyncHandler(updateMeHandler));
usersRouter.get('/:id', validateParams(userIdParamsSchema), asyncHandler(profileHandler));
