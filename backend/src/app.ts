import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { allowedOrigins, env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { challengesRouter } from './modules/challenges/challenges.routes.js';
import { eventsRouter } from './modules/events/events.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { scoreboardRouter } from './modules/scoreboard/scoreboard.routes.js';
import { submissionsRouter } from './modules/submissions/submissions.routes.js';
import { teamsRouter } from './modules/teams/teams.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true, service: 'yourctf-api', env: env.NODE_ENV, time: new Date().toISOString() });
  });

  app.use('/api/v1', apiLimiter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/teams', teamsRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/challenges', challengesRouter);
  app.use('/api/v1/submissions', submissionsRouter);
  app.use('/api/v1/files', filesRouter);
  app.use('/api/v1/scoreboard', scoreboardRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
