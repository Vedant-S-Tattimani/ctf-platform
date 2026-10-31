import type { User } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { HttpError } from './errorHandler.js';
import { verifyToken } from '../utils/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/** Populates req.user when a valid session exists, but never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  (async () => {
    const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || (payload.sv ?? 0) !== user.sessionVersion) return null;
    return user;
  })().then(
    (user) => {
      req.user = user ?? undefined;
      next();
    },
    () => next(),
  );
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  (async () => {
    const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new HttpError(401, 'Authentication required');
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new HttpError(401, 'Session expired or invalid');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new HttpError(401, 'Account no longer exists');
    }
    if ((payload.sv ?? 0) !== user.sessionVersion) {
      throw new HttpError(401, 'Session expired or invalid');
    }

    req.user = user;
  })().then(
    () => next(),
    (err) => next(err),
  );
}
