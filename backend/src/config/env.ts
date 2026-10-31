import 'dotenv/config';
import { z } from 'zod';

const DEFAULT_JWT_SECRET = 'dev-only-insecure-secret-change-me';
const DEFAULT_ADMIN_PASSWORD = 'ChangeMe123!';
const DEFAULT_DATABASE_URL = 'file:./dev.db';

const booleanish = z
  .enum(['true', 'false', '1', '0'])
  .optional()
  .transform((v) => v === 'true' || v === '1');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    APP_BASE_URL: z.string().url().default('http://localhost:5173'),

    DATABASE_URL: z.string().default(DEFAULT_DATABASE_URL),

    JWT_SECRET: z.string().min(16).default(DEFAULT_JWT_SECRET),
    JWT_EXPIRES_IN: z.string().default('7d'),
    COOKIE_NAME: z.string().default('yourctf_session'),
    COOKIE_SECURE: booleanish.default('false'),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    SUBMIT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),

    REQUIRE_EMAIL_VERIFICATION: booleanish.default('false'),

    FLAG_HASH_ALGORITHM: z.enum(['sha256', 'sha512']).default('sha256'),
    // Off by default: even a truncated hash is metadata organizers rarely need.
    WRONG_ATTEMPT_DISPLAY_PREFIX: booleanish.default('false'),

    UPLOAD_DIR: z.string().default('./uploads'),
    UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),

    MAIL_TRANSPORT: z.enum(['console', 'webhook']).optional(),
    MAIL_WEBHOOK_URL: z.string().url().optional(),
    MAIL_FROM: z.string().min(3).default('YourCTF <no-reply@yourctf.local>'),

    ADMIN_USERNAME: z.string().default('admin'),
    ADMIN_EMAIL: z.string().email().default('admin@yourctf.local'),
    ADMIN_PASSWORD: z.string().min(8).default(DEFAULT_ADMIN_PASSWORD),
  })
  // Production must never boot on the development defaults: a shipped app with
  // a known JWT secret, known admin password, insecure cookie or SQLite file
  // would be trivially compromised.
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') return;

    if (data.JWT_SECRET === DEFAULT_JWT_SECRET || data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'Set a random JWT_SECRET of at least 32 characters',
      });
    }
    if (data.ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ADMIN_PASSWORD'],
        message: 'Change the bootstrap admin password before running in production',
      });
    }
    if (!data.COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SECURE'],
        message: 'Session cookies must be Secure in production (COOKIE_SECURE=true)',
      });
    }
    if (data.DATABASE_URL === DEFAULT_DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'Set a production DATABASE_URL (the default SQLite dev file is not allowed)',
      });
    }
    if (!data.MAIL_TRANSPORT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MAIL_TRANSPORT'],
        message: 'Set MAIL_TRANSPORT (console or webhook) in production',
      });
    }
    if (data.MAIL_TRANSPORT === 'webhook' && !data.MAIL_WEBHOOK_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MAIL_WEBHOOK_URL'],
        message: 'MAIL_WEBHOOK_URL is required when MAIL_TRANSPORT=webhook',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export type EnvValidation = { data: Env; issues?: never } | { data?: never; issues: string[] };

/** Pure validator so production hardening can be unit tested without booting. */
export function parseEnv(raw: NodeJS.ProcessEnv): EnvValidation {
  const parsed = envSchema.safeParse(raw);
  if (parsed.success) return { data: parsed.data };
  return {
    issues: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`),
  };
}

const result = parseEnv(process.env);

if (!result.data) {
  console.error(`Invalid environment configuration:\n${result.issues.map((i) => `  - ${i}`).join('\n')}`);
  process.exit(1);
}

export const env: Env = result.data;

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
