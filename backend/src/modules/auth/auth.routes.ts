import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { loginLimiter } from '../../middleware/rateLimit.js';
import { validateBody } from '../../middleware/validate.js';
import {
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  sessionHandler,
  verifyEmailHandler,
} from './auth.controller.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  loginLimiter,
  validateBody(registerSchema),
  asyncHandler(registerHandler),
);
authRouter.post('/login', loginLimiter, validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.post('/logout', logoutHandler);
authRouter.get('/me', requireAuth, meHandler);
// Always 200 so the frontend can bootstrap without treating guests as errors.
authRouter.get('/session', optionalAuth, sessionHandler);

authRouter.post(
  '/forgot-password',
  loginLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(forgotPasswordHandler),
);
authRouter.post(
  '/reset-password',
  loginLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(resetPasswordHandler),
);
authRouter.post(
  '/verify-email',
  loginLimiter,
  validateBody(verifyEmailSchema),
  asyncHandler(verifyEmailHandler),
);
authRouter.post(
  '/resend-verification',
  requireAuth,
  loginLimiter,
  asyncHandler(resendVerificationHandler),
);
