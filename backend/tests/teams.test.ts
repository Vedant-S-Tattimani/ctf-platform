import { describe, expect, it } from 'vitest';
import { newAgent, registerUser } from './helpers.js';
import request from 'supertest';
import { app } from './helpers.js';

describe('teams', () => {
  it('requires authentication to create a team', async () => {
    const res = await request(app).post('/api/v1/teams').send({ name: 'Ghost Crew' });
    expect(res.status).toBe(401);
  });

  it('creates a team with the creator as owner and member', async () => {
    const agent = newAgent();
    await registerUser(agent);

    const res = await agent.post('/api/v1/teams').send({ name: `Crew ${Date.now()}` });
    expect(res.status).toBe(201);
    expect(res.body.team).toMatchObject({ memberCount: 1 });
    expect(res.body.team.inviteCode).toMatch(/^[A-Z0-9]{6,}$/);

    const me = await agent.get('/api/v1/teams/me');
    expect(me.status).toBe(200);
    expect(me.body.team.id).toBe(res.body.team.id);
  });

  it('blocks a second team while already in one', async () => {
    const agent = newAgent();
    await registerUser(agent);
    await agent.post('/api/v1/teams').send({ name: `First ${Date.now()}` }).expect(201);
    const second = await agent.post('/api/v1/teams').send({ name: `Second ${Date.now()}` });
    expect(second.status).toBe(409);
  });

  it('lets a second player join by invite code and leave again', async () => {
    const ownerAgent = newAgent();
    await registerUser(ownerAgent);
    const created = await ownerAgent.post('/api/v1/teams').send({ name: `Join ${Date.now()}` });
    const inviteCode = created.body.team.inviteCode as string;

    const memberAgent = newAgent();
    await registerUser(memberAgent);
    const joined = await memberAgent.post('/api/v1/teams/join').send({ inviteCode });
    expect(joined.status).toBe(200);
    expect(joined.body.team.memberCount).toBe(2);

    const left = await memberAgent.post('/api/v1/teams/leave');
    expect(left.status).toBe(200);
    expect(left.body).toMatchObject({ deleted: false });

    const after = await ownerAgent.get('/api/v1/teams/me');
    expect(after.body.team.memberCount).toBe(1);
  });

  it('never exposes member email addresses on team payloads', async () => {
    const agent = newAgent();
    await registerUser(agent);
    const created = await agent.post('/api/v1/teams').send({ name: `Privacy ${Date.now()}` });
    expect(created.status).toBe(201);
    expect(created.body.team.members[0]).not.toHaveProperty('email');
    expect(created.body.team.members[0]).toHaveProperty('username');
  });

  it('hides the invite code from public team lookups', async () => {
    const agent = newAgent();
    await registerUser(agent);
    const created = await agent.post('/api/v1/teams').send({ name: `Secret ${Date.now()}` });
    const inviteCode = created.body.team.inviteCode as string;

    const publicLookup = await request(app).get(`/api/v1/teams/${created.body.team.id}`);
    expect(publicLookup.status).toBe(200);
    expect(publicLookup.body.team.inviteCode).toBeNull();

    const mine = await agent.get('/api/v1/teams/me');
    expect(mine.body.team.inviteCode).toBe(inviteCode);
  });

  it('rejects unknown invite codes', async () => {
    const agent = newAgent();
    await registerUser(agent);
    const res = await agent.post('/api/v1/teams/join').send({ inviteCode: 'ZZZZZZ' });
    expect(res.status).toBe(404);
  });

  it('deletes the team when the sole owner leaves', async () => {
    const agent = newAgent();
    await registerUser(agent);
    const created = await agent.post('/api/v1/teams').send({ name: `Solo ${Date.now()}` });
    const teamId = created.body.team.id as string;

    const left = await agent.post('/api/v1/teams/leave');
    expect(left.status).toBe(200);
    expect(left.body).toMatchObject({ deleted: true });

    const gone = await request(app).get(`/api/v1/teams/${teamId}`);
    expect(gone.status).toBe(404);
  });

  it('only lets the owner edit the team', async () => {
    const ownerAgent = newAgent();
    await registerUser(ownerAgent);
    const created = await ownerAgent.post('/api/v1/teams').send({ name: `Edit ${Date.now()}` });
    const inviteCode = created.body.team.inviteCode as string;

    const memberAgent = newAgent();
    await registerUser(memberAgent);
    await memberAgent.post('/api/v1/teams/join').send({ inviteCode }).expect(200);

    const forbidden = await memberAgent.patch('/api/v1/teams/me').send({ name: 'Hijacked' });
    expect(forbidden.status).toBe(403);

    const ok = await ownerAgent.patch('/api/v1/teams/me').send({ name: `Renamed ${Date.now()}` });
    expect(ok.status).toBe(200);
  });
});
