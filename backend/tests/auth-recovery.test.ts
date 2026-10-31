import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/db/prisma.js';
import { hashOpaqueToken } from '../src/utils/hash.js';
import { clearOutbox, getOutbox } from '../src/utils/mail.js';
import { app, credentials, newAgent } from './helpers.js';

function extractToken(text: string, path: string): string {
  const match = new RegExp(`${path.replace(/[/]/g, '\\/')}\\?token=([A-Za-z0-9_-]+)`).exec(text);
  if (!match?.[1]) throw new Error(`No token in mail: ${text}`);
  return match[1];
}

async function registerAgent() {
  const agent = newAgent();
  const creds = credentials();
  const res = await agent.post('/api/v1/auth/register').send(creds);
  expect(res.status).toBe(201);
  return { agent, creds };
}

describe('email verification and password recovery', () => {
  beforeEach(() => clearOutbox());

  it('mails a verification link that works once', async () => {
    const { agent, creds } = await registerAgent();
    const me = await agent.get('/api/v1/auth/me');
    expect(me.body.user.emailVerifiedAt).toBeNull();

    const mail = getOutbox().find((message) => message.to === creds.email);
    expect(mail).toBeDefined();
    const token = extractToken(mail!.text, '/verify-email');

    const verified = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(verified.status).toBe(200);
    expect(verified.body.user.emailVerifiedAt).not.toBeNull();

    const reuse = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(reuse.status).toBe(400);
  });

  it('resends verification only while the address is unverified', async () => {
    const { agent, creds } = await registerAgent();
    const token = extractToken(getOutbox()[0]!.text, '/verify-email');
    await request(app).post('/api/v1/auth/verify-email').send({ token }).expect(200);

    clearOutbox();
    const resend = await agent.post('/api/v1/auth/resend-verification');
    expect(resend.status).toBe(200);
    expect(resend.body).toMatchObject({ alreadyVerified: true });
    expect(getOutbox()).toHaveLength(0);

    const fresh = await registerAgent();
    clearOutbox();
    const again = await fresh.agent.post('/api/v1/auth/resend-verification');
    expect(again.body).toMatchObject({ alreadyVerified: false });
    expect(getOutbox().find((message) => message.to === fresh.creds.email)).toBeDefined();
  });

  it('returns a generic response for unknown emails and sends nothing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(getOutbox()).toHaveLength(0);
  });

  it('resets the password, invalidates other sessions and burns every outstanding link', async () => {
    const { agent, creds } = await registerAgent();
    clearOutbox();

    await request(app).post('/api/v1/auth/forgot-password').send({ email: creds.email }).expect(200);
    const firstToken = extractToken(getOutbox()[0]!.text, '/reset-password');

    await request(app).post('/api/v1/auth/forgot-password').send({ email: creds.email }).expect(200);
    const secondToken = extractToken(getOutbox()[1]!.text, '/reset-password');

    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: secondToken, password: 'N3wPassw0rd!' });
    expect(reset.status).toBe(200);

    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: creds.email, password: creds.password });
    expect(oldLogin.status).toBe(401);

    const staleSession = await agent.get('/api/v1/auth/me');
    expect(staleSession.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: creds.email, password: 'N3wPassw0rd!' });
    expect(newLogin.status).toBe(200);

    const reused = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: secondToken, password: 'An0therPass!' });
    expect(reused.status).toBe(400);

    const olderLink = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: firstToken, password: 'An0therPass!' });
    expect(olderLink.status).toBe(400);
  });

  it('rejects expired links and weak passwords', async () => {
    await registerAgent();
    const token = extractToken(getOutbox()[0]!.text, '/verify-email');
    await prisma.authToken.update({
      where: { tokenHash: hashOpaqueToken(token) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const expired = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(expired.status).toBe(400);

    const weak = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'x'.repeat(32), password: 'short' });
    expect(weak.status).toBe(400);
    expect(weak.body).toHaveProperty('details');

    const missing = await request(app).post('/api/v1/auth/verify-email').send({});
    expect(missing.status).toBe(400);
  });
});
