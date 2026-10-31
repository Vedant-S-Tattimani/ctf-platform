import { Router, raw } from 'express';
import { env } from '../../config/env.js';
import { requireAdmin } from '../../middleware/admin.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as h from './admin.controller.js';
import {
  addFileSchema,
  addHintSchema,
  createCategorySchema,
  createChallengeSchema,
  createEventSchema,
  flagInputSchema,
  idParamsSchema,
  listQuerySchema,
  updateCategorySchema,
  updateChallengeSchema,
  updateEventSchema,
} from './admin.schema.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

// challenges
adminRouter.get('/challenges', asyncHandler(h.listChallengesHandler));
adminRouter.get('/challenges/:id', validateParams(idParamsSchema), asyncHandler(h.getChallengeHandler));
adminRouter.post('/challenges', validateBody(createChallengeSchema), asyncHandler(h.createChallengeHandler));
adminRouter.patch('/challenges/:id', validateParams(idParamsSchema), validateBody(updateChallengeSchema), asyncHandler(h.updateChallengeHandler));
adminRouter.delete('/challenges/:id', validateParams(idParamsSchema), asyncHandler(h.deleteChallengeHandler));
adminRouter.post('/challenges/:id/flags', validateParams(idParamsSchema), validateBody(flagInputSchema), asyncHandler(h.addFlagHandler));
adminRouter.delete('/flags/:id', validateParams(idParamsSchema), asyncHandler(h.deleteFlagHandler));
adminRouter.post('/challenges/:id/hints', validateParams(idParamsSchema), validateBody(addHintSchema), asyncHandler(h.addHintHandler));
adminRouter.delete('/hints/:id', validateParams(idParamsSchema), asyncHandler(h.deleteHintHandler));
adminRouter.post('/challenges/:id/files', validateParams(idParamsSchema), validateBody(addFileSchema), asyncHandler(h.addFileHandler));
adminRouter.delete('/files/:id', validateParams(idParamsSchema), asyncHandler(h.deleteFileHandler));
// Raw upload: the file name travels in X-File-Name (URI-encoded) and the MIME
// type in Content-Type. The JSON parser above ignores these content types.
adminRouter.post(
  '/files',
  raw({ type: () => true, limit: env.UPLOAD_MAX_BYTES }),
  asyncHandler(h.uploadFileHandler),
);

// categories
adminRouter.get('/categories', asyncHandler(h.listCategoriesHandler));
adminRouter.post('/categories', validateBody(createCategorySchema), asyncHandler(h.createCategoryHandler));
adminRouter.patch('/categories/:id', validateParams(idParamsSchema), validateBody(updateCategorySchema), asyncHandler(h.updateCategoryHandler));
adminRouter.delete('/categories/:id', validateParams(idParamsSchema), asyncHandler(h.deleteCategoryHandler));

// events
adminRouter.get('/events', asyncHandler(h.listEventsHandler));
adminRouter.post('/events', validateBody(createEventSchema), asyncHandler(h.createEventHandler));
adminRouter.patch('/events/:id', validateParams(idParamsSchema), validateBody(updateEventSchema), asyncHandler(h.updateEventHandler));

// listings
adminRouter.get('/users', validateQuery(listQuerySchema), asyncHandler(h.listUsersHandler));
adminRouter.get('/teams', validateQuery(listQuerySchema), asyncHandler(h.listTeamsHandler));
adminRouter.get('/submissions', validateQuery(listQuerySchema), asyncHandler(h.listSubmissionsHandler));
