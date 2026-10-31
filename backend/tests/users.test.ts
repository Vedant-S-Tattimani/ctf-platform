import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, newAgent, registerUser } from './helpers.js';

describe('users', () => {
  it('returns the email only on the caller-owned profile', async () => {
    const agent = newAgent();
    const user = await registerUser(agent);

    const me = await agent.get('/api/v1/users/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(user.email);
    expect(me.body.user).toHaveProperty('teamName', null);

    const publicProfile = await request(app).get(`/api/v1/users/${user.id}`);
    expect(publicProfile.status).toBe(200);
    expect(publicProfile.body.user.username).toBe(user.username);
    expect(publicProfile.body.user).not.toHaveProperty('email');
    expect(publicProfile.body.user).toHaveProperty('teamName');
  });

  it('returns 404 for unknown profiles', async () => {
    const res = await request(app).get('/api/v1/users/does-not-exist');
    expect(res.status).toBe(404);
  });
});
