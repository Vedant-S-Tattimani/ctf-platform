import type { ErrorRequestHandler, RequestHandler } from 'express';
import { isProd } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // express.raw / express.json raise this when the body passes the size limit.
  if ((err as { type?: string } | null)?.type === 'entity.too.large') {
    res.status(413).json({ error: 'That upload is larger than the allowed limit' });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  logger.error('Unhandled error', {
    path: req.originalUrl,
    message: err instanceof Error ? err.message : String(err),
  });

  res.status(500).json({
    error: isProd ? 'Internal server error' : (err as Error)?.message ?? 'Internal server error',
  });
};
