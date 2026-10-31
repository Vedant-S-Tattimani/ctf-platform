import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config/env.js';

const base = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
};

export const apiLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

export const loginLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  message: { error: 'Too many authentication attempts, try again later.' },
});

export const submitLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.SUBMIT_RATE_LIMIT_MAX,
  message: { error: 'Too many flag submissions, try again later.' },
});
