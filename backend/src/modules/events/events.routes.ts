import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { currentEventHandler } from './events.controller.js';

export const eventsRouter = Router();

eventsRouter.get('/current', asyncHandler(currentEventHandler));
