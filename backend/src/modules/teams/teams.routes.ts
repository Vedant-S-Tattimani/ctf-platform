import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createTeamHandler,
  joinTeamHandler,
  leaveTeamHandler,
  myTeamHandler,
  regenerateInviteCodeHandler,
  removeMemberHandler,
  teamHandler,
  transferOwnershipHandler,
  updateTeamHandler,
} from './teams.controller.js';
import {
  createTeamSchema,
  joinTeamSchema,
  memberParamsSchema,
  teamIdParamsSchema,
  transferOwnershipSchema,
  updateTeamSchema,
} from './teams.schema.js';

export const teamsRouter = Router();

teamsRouter.post('/', requireAuth, validateBody(createTeamSchema), asyncHandler(createTeamHandler));
teamsRouter.post('/join', requireAuth, validateBody(joinTeamSchema), asyncHandler(joinTeamHandler));
teamsRouter.post('/leave', requireAuth, asyncHandler(leaveTeamHandler));
teamsRouter.get('/me', requireAuth, asyncHandler(myTeamHandler));
teamsRouter.patch('/me', requireAuth, validateBody(updateTeamSchema), asyncHandler(updateTeamHandler));
teamsRouter.delete(
  '/me/members/:userId',
  requireAuth,
  validateParams(memberParamsSchema),
  asyncHandler(removeMemberHandler),
);
teamsRouter.post(
  '/me/transfer',
  requireAuth,
  validateBody(transferOwnershipSchema),
  asyncHandler(transferOwnershipHandler),
);
teamsRouter.post('/me/invite-code', requireAuth, asyncHandler(regenerateInviteCodeHandler));
teamsRouter.get('/:id', validateParams(teamIdParamsSchema), asyncHandler(teamHandler));
