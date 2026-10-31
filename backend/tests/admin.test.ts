import { describe, expect, it } from 'vitest';
import {
  createTestChallenge,
  ensureCategory,
  makeAdmin,
  newAgent,
  registerUser,
} from './helpers.js';
import request from 'supertest';
import { app } from './helpers.js';

describe('admin', () => {
  it('blocks anonymous and non-admin users', async () => {
    const anonymous = await request(app).get('/api/v1/admin/users');
    expect(anonymous.status).toBe(401);

    const agent = newAgent();
    await registerUser(agent);
    const forbidden = await agent.get('/api/v1/admin/users');
    expect(forbidden.status).toBe(403);
  });

  it('manages categories and refuses deleting one in use', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, `Temp ${Date.now()}`);

    const dup = await adminAgent.post('/api/v1/admin/categories').send({ name: 'Temp dup clash' });
    expect(dup.status).toBe(201);
    const again = await adminAgent.post('/api/v1/admin/categories').send({ name: 'Temp dup clash' });
    expect(again.status).toBe(409);

    await createTestChallenge(adminAgent, categoryId);
    const blocked = await adminAgent.delete(`/api/v1/admin/categories/${categoryId}`);
    expect(blocked.status).toBe(409);
  });

  it('creates, unpublishes and deletes challenges', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');
    const challenge = await createTestChallenge(adminAgent, categoryId);

    const visible = await request(app).get('/api/v1/challenges');
    expect(visible.body.challenges.some((c: { id: string }) => c.id === challenge.id)).toBe(true);

    const hidden = await adminAgent
      .patch(`/api/v1/admin/challenges/${challenge.id}`)
      .send({ published: false });
    expect(hidden.status).toBe(200);
    const after = await request(app).get('/api/v1/challenges');
    expect(after.body.challenges.some((c: { id: string }) => c.id === challenge.id)).toBe(false);

    const removed = await adminAgent.delete(`/api/v1/admin/challenges/${challenge.id}`);
    expect(removed.status).toBe(200);
    const gone = await request(app).get(`/api/v1/challenges/${challenge.id}`);
    expect(gone.status).toBe(404);
  });

  it('adds hints and flags to an existing challenge', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Web');
    const challenge = await createTestChallenge(adminAgent, categoryId);

    const hint = await adminAgent
      .post(`/api/v1/admin/challenges/${challenge.id}/hints`)
      .send({ content: 'Try the headers.', cost: 10 });
    expect(hint.status).toBe(201);

    const flag = await adminAgent
      .post(`/api/v1/admin/challenges/${challenge.id}/flags`)
      .send({ label: 'Task 2', value: 'YourCTF{second_task}', points: 80 });
    expect(flag.status).toBe(201);

    const detail = await request(app).get(`/api/v1/challenges/${challenge.id}`);
    expect(detail.body.challenge.flags).toHaveLength(2);
    expect(detail.body.challenge.hints[0]).toMatchObject({
      content: null,
      unlocked: false,
      cost: 10,
    });

    const adminDetail = await adminAgent.get(`/api/v1/admin/challenges/${challenge.id}`);
    expect(adminDetail.body.challenge.hints[0]).toMatchObject({ content: 'Try the headers.' });
  });

  it('creates events and edits their start/end times', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);

    const created = await adminAgent.post('/api/v1/admin/events').send({
      name: `Night Event ${Date.now()}`,
      published: true,
    });
    expect(created.status).toBe(201);

    const patched = await adminAgent.patch(`/api/v1/admin/events/${created.body.event.id}`).send({
      startsAt: '2026-11-01T18:00:00.000Z',
      endsAt: '2026-11-02T18:00:00.000Z',
    });
    expect(patched.status).toBe(200);
    expect(patched.body.event).toMatchObject({
      startsAt: '2026-11-01T18:00:00.000Z',
      endsAt: '2026-11-02T18:00:00.000Z',
    });
  });

  it('lists challenges including drafts and hides flag secrets', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');
    const draft = await createTestChallenge(adminAgent, categoryId, { published: false });
    const live = await createTestChallenge(adminAgent, categoryId, { published: true });

    const listed = await adminAgent.get('/api/v1/admin/challenges');
    expect(listed.status).toBe(200);
    const ids = (listed.body.challenges as { id: string }[]).map((c) => c.id);
    expect(ids).toContain(draft.id);
    expect(ids).toContain(live.id);

    const detail = await adminAgent.get(`/api/v1/admin/challenges/${draft.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.challenge.published).toBe(false);
    expect(detail.body.challenge.flags).toHaveLength(1);
    expect(detail.body.challenge.flags[0]).not.toHaveProperty('hash');
    expect(detail.body.challenge.flags[0]).not.toHaveProperty('salt');

    const missing = await adminAgent.get('/api/v1/admin/challenges/nope');
    expect(missing.status).toBe(404);
  });

  it('lists users, teams and submissions', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Forensics');
    const challenge = await createTestChallenge(adminAgent, categoryId);

    const playerAgent = newAgent();
    await registerUser(playerAgent);
    await playerAgent.post('/api/v1/teams').send({ name: `Listed ${Date.now()}` }).expect(201);
    await playerAgent
      .post('/api/v1/submissions')
      .send({ challengeId: challenge.id, flag: challenge.flagValue })
      .expect(200);

    const users = await adminAgent.get('/api/v1/admin/users');
    expect(users.status).toBe(200);
    expect(users.body.total).toBeGreaterThanOrEqual(2);

    const teams = await adminAgent.get('/api/v1/admin/teams');
    expect(teams.body.total).toBeGreaterThanOrEqual(1);

    const submissions = await adminAgent.get('/api/v1/admin/submissions');
    expect(submissions.body.submissions[0]).toMatchObject({ correct: true });
    expect(submissions.body.submissions[0]).not.toHaveProperty('flagId');
  });
});
