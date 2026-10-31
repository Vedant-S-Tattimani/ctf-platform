import { describe, expect, it } from 'vitest';
import { app, credentials, newAgent, registerUser } from './helpers.js';
import request from 'supertest';

describe('auth', () => {
  it('registers a user, sets a session cookie and never leaks the password hash', async () => {
    const agent = newAgent();
    const res = await agent.post('/api/v1/auth/register').send(credentials());

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ role: 'USER' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie']?.[0]).toContain('HttpOnly');

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(res.body.user.id);
  });

  it('rejects a duplicate email and a duplicate username', async () => {
    const agent = newAgent();
    const creds = credentials();
    await agent.post('/api/v1/auth/register').send(creds).expect(201);

    const dupEmail = await agent
      .post('/api/v1/auth/register')
      .send({ ...creds, username: 'someone_else' });
    expect(dupEmail.status).toBe(409);

    const dupUsername = await agent
      .post('/api/v1/auth/register')
      .send({ ...creds, email: `other_${Date.now()}@example.com` });
    expect(dupUsername.status).toBe(409);
  });

  it('validates registration input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'ab', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('logs in with correct credentials and rejects wrong passwords', async () => {
    const agent = newAgent();
    const creds = credentials();
    await agent.post('/api/v1/auth/register').send(creds).expect(201);
    await agent.post('/api/v1/auth/logout').expect(200);

    const bad = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: creds.email, password: 'WrongPassword1!' });
    expect(bad.status).toBe(401);

    const good = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: creds.email, password: creds.password });
    expect(good.status).toBe(200);
    expect(good.headers['set-cookie']?.[0]).toBeDefined();
  });

  it('requires authentication for /me and clears the session on logout', async () => {
    const anonymous = await request(app).get('/api/v1/auth/me');
    expect(anonymous.status).toBe(401);

    const agent = newAgent();
    await registerUser(agent);
    await agent.get('/api/v1/auth/me').expect(200);
    await agent.post('/api/v1/auth/logout').expect(200);
    const after = await agent.get('/api/v1/auth/me');
    expect(after.status).toBe(401);
  });
});
