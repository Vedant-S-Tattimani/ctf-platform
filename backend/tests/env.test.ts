import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/config/env.js';

const production = {
  NODE_ENV: 'production',
  JWT_SECRET: 'x'.repeat(40),
  ADMIN_PASSWORD: 'A-strong-admin-pass!',
  COOKIE_SECURE: 'true',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/yourctf?schema=public',
  MAIL_TRANSPORT: 'console',
};

function issuePaths(env: Record<string, string | undefined>): string[] {
  const result = parseEnv(env);
  return result.issues ?? [];
}

describe('environment validation', () => {
  it('accepts development defaults', () => {
    const result = parseEnv({ NODE_ENV: 'development' });
    expect(result.data).toBeDefined();
    expect(result.data?.DATABASE_URL).toBe('file:./dev.db');
    expect(result.data?.COOKIE_SECURE).toBe(false);
  });

  it('accepts a hardened production configuration', () => {
    const result = parseEnv(production);
    expect(result.issues).toBeUndefined();
    expect(result.data?.NODE_ENV).toBe('production');
  });

  it('refuses production on the development JWT secret', () => {
    expect(issuePaths({ ...production, JWT_SECRET: undefined }).some((i) => i.startsWith('JWT_SECRET:'))).toBe(true);
    expect(issuePaths({ ...production, JWT_SECRET: 'too-short-secret' }).some((i) => i.startsWith('JWT_SECRET:'))).toBe(true);
  });

  it('refuses production on the default admin password', () => {
    expect(issuePaths({ ...production, ADMIN_PASSWORD: undefined }).some((i) => i.startsWith('ADMIN_PASSWORD:'))).toBe(true);
  });

  it('requires secure cookies in production', () => {
    expect(issuePaths({ ...production, COOKIE_SECURE: undefined }).some((i) => i.startsWith('COOKIE_SECURE:'))).toBe(true);
    expect(issuePaths({ ...production, COOKIE_SECURE: 'false' }).some((i) => i.startsWith('COOKIE_SECURE:'))).toBe(true);
  });

  it('refuses the SQLite development database in production', () => {
    expect(issuePaths({ ...production, DATABASE_URL: undefined }).some((i) => i.startsWith('DATABASE_URL:'))).toBe(true);
  });

  it('requires a mail transport in production and a webhook URL when chosen', () => {
    expect(issuePaths({ ...production, MAIL_TRANSPORT: undefined }).some((i) => i.startsWith('MAIL_TRANSPORT:'))).toBe(true);
    expect(
      issuePaths({ ...production, MAIL_TRANSPORT: 'webhook' }).some((i) => i.startsWith('MAIL_WEBHOOK_URL:')),
    ).toBe(true);
    expect(
      parseEnv({
        ...production,
        MAIL_TRANSPORT: 'webhook',
        MAIL_WEBHOOK_URL: 'https://mail.example.com/hooks/yourctf',
      }).data,
    ).toBeDefined();
  });
});
