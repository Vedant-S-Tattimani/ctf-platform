import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, newAgent, registerUser } from './helpers.js';

describe('session bootstrap', () => {
  it('answers 200 with a null user for guests', async () => {
    const res = await request(app).get('/api/v1/auth/session');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it('returns the signed-in user and clears on logout', async () => {
    const agent = newAgent();
    const user = await registerUser(agent);

    const session = await agent.get('/api/v1/auth/session');
    expect(session.status).toBe(200);
    expect(session.body.user).toMatchObject({ id: user.id, email: user.email });

    await agent.post('/api/v1/auth/logout').expect(200);
    const after = await agent.get('/api/v1/auth/session');
    expect(after.status).toBe(200);
    expect(after.body).toEqual({ user: null });
  });

  it('treats an invalid cookie as a guest instead of an error', async () => {
    const res = await request(app)
      .get('/api/v1/auth/session')
      .set('Cookie', 'yourctf_session=not-a-real-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it('still protects /auth/me for guests', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
