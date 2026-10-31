import { describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  app,
  createTestChallenge,
  credentials,
  ensureCategory,
  makeAdmin,
  newAgent,
  registerUser,
} from './helpers.js';

describe('hint unlocks', () => {
  it('never returns paid hint text until it is unlocked', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');
    const created = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Locked ${Date.now()}`,
      description: 'Locked hint check.',
      categoryId,
      points: 50,
      published: true,
      flags: [{ value: 'YourCTF{locked_hint_flag}', points: 50 }],
      hints: [{ content: 'Paid secret clue', cost: 20 }],
    });
    const challengeId = created.body.challenge.id as string;

    const anonymous = await request(app).get(`/api/v1/challenges/${challengeId}`);
    expect(anonymous.status).toBe(200);
    expect(anonymous.body.challenge.hints[0]).toMatchObject({
      content: null,
      unlocked: false,
      cost: 20,
    });
    expect(JSON.stringify(anonymous.body)).not.toContain('Paid secret clue');

    const player = newAgent();
    await registerUser(player);
    const authed = await player.get(`/api/v1/challenges/${challengeId}`);
    expect(authed.body.challenge.hints[0]).toMatchObject({ content: null, unlocked: false });
  });

  it('rejects an unlock without enough points and reports the current score', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');
    const created = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Broke ${Date.now()}`,
      description: 'Insufficient points.',
      categoryId,
      points: 50,
      published: true,
      flags: [{ value: 'YourCTF{broke_player_flag}', points: 50 }],
      hints: [{ content: 'Expensive clue', cost: 30 }],
    });
    const challengeId = created.body.challenge.id as string;
    const detail = await request(app).get(`/api/v1/challenges/${challengeId}`);
    const hintId = detail.body.challenge.hints[0].id as string;

    const player = newAgent();
    await registerUser(player);
    const res = await player.post(`/api/v1/challenges/${challengeId}/hints/${hintId}/unlock`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/not enough points/i);
    expect(res.body.details).toMatchObject({ code: 'INSUFFICIENT_POINTS', points: 0 });
  });

  it('deducts the cost once, reveals the text and updates the scoreboard', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');
    const flagValue = `YourCTF{deduct_${Math.random().toString(36).slice(2, 8)}}`;
    const created = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Deduct ${Date.now()}`,
      description: 'Deduction check.',
      categoryId,
      points: 50,
      published: true,
      flags: [{ value: flagValue, points: 50 }],
      hints: [{ content: 'Clue worth 30', cost: 30 }],
    });
    const challengeId = created.body.challenge.id as string;
    const detail = await request(app).get(`/api/v1/challenges/${challengeId}`);
    const hintId = detail.body.challenge.hints[0].id as string;

    const player = newAgent();
    const creds = credentials();
    await player.post('/api/v1/auth/register').send(creds).expect(201);
    await player
      .post('/api/v1/submissions')
      .send({ challengeId, flag: flagValue })
      .expect(200);

    const unlock = await player.post(`/api/v1/challenges/${challengeId}/hints/${hintId}/unlock`);
    expect(unlock.status).toBe(200);
    expect(unlock.body).toMatchObject({
      alreadyUnlocked: false,
      pointsSpent: 30,
      points: 20,
      hint: { content: 'Clue worth 30', unlocked: true },
    });

    const again = await player.post(`/api/v1/challenges/${challengeId}/hints/${hintId}/unlock`);
    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ alreadyUnlocked: true, pointsSpent: 0, points: 20 });

    const after = await player.get(`/api/v1/challenges/${challengeId}`);
    expect(after.body.challenge.hints[0]).toMatchObject({
      content: 'Clue worth 30',
      unlocked: true,
    });

    const board = await request(app).get('/api/v1/scoreboard?scope=users');
    const me = (board.body.entries as { name: string; points: number }[]).find(
      (entry) => entry.name === creds.username,
    );
    expect(me?.points).toBe(20);
  });

  it('charges a team once even when several members unlock the same hint', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');

    const eventSlug = `hint-event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const event = await adminAgent.post('/api/v1/admin/events').send({
      name: `Hint Event ${eventSlug}`,
      slug: eventSlug,
      published: true,
    });
    expect(event.status).toBe(201);
    const eventId = event.body.event.id as string;

    const flagValue = `YourCTF{team_hint_${Math.random().toString(36).slice(2, 8)}}`;
    const created = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Team hint ${Date.now()}`,
      description: 'Team ledger.',
      categoryId,
      eventId,
      points: 60,
      published: true,
      flags: [{ value: flagValue, points: 60 }],
      hints: [{ content: 'Shared clue', cost: 25 }],
    });
    const challengeId = created.body.challenge.id as string;
    const detail = await request(app).get(`/api/v1/challenges/${challengeId}`);
    const hintId = detail.body.challenge.hints[0].id as string;

    const owner = newAgent();
    await registerUser(owner);
    const teamName = `Ledger ${Date.now()}`;
    const opened = await owner.post('/api/v1/teams').send({ name: teamName });
    const inviteCode = opened.body.team.inviteCode as string;
    await owner.post('/api/v1/submissions').send({ challengeId, flag: flagValue }).expect(200);

    const member = newAgent();
    await registerUser(member);
    await member.post('/api/v1/teams/join').send({ inviteCode }).expect(200);

    const first = await member.post(`/api/v1/challenges/${challengeId}/hints/${hintId}/unlock`);
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ alreadyUnlocked: false, pointsSpent: 25, points: 35 });

    const second = await owner.post(`/api/v1/challenges/${challengeId}/hints/${hintId}/unlock`);
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ alreadyUnlocked: true, pointsSpent: 0, points: 35 });

    const board = await request(app).get(`/api/v1/scoreboard?scope=teams&eventId=${eventId}`);
    const entry = (board.body.entries as { name: string; points: number }[]).find(
      (row) => row.name === teamName,
    );
    expect(entry?.points).toBe(35);

    const history = await request(app).get(`/api/v1/scoreboard/history?scope=teams&eventId=${eventId}`);
    const series = (history.body.series as { name: string; points: { y: number }[] }[]).find(
      (row) => row.name === teamName,
    );
    expect(series?.points.at(-1)?.y).toBe(35);
  });

  it('blocks unlocks after the event has ended', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');
    const stamp = Date.now();
    const event = await adminAgent.post('/api/v1/admin/events').send({
      name: `Ended ${stamp}`,
      slug: `ended-${stamp}`,
      startsAt: new Date(stamp - 7_200_000).toISOString(),
      endsAt: new Date(stamp - 3_600_000).toISOString(),
      published: true,
    });
    const eventId = event.body.event.id as string;

    const created = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Ended hint ${stamp}`,
      description: 'Ended event.',
      categoryId,
      eventId,
      points: 50,
      published: true,
      flags: [{ value: 'YourCTF{ended_hint_flag}', points: 50 }],
      hints: [{ content: 'Too late', cost: 10 }],
    });
    const challengeId = created.body.challenge.id as string;

    const player = newAgent();
    await registerUser(player);

    const detail = await request(app).get(`/api/v1/challenges/${challengeId}`);
    const hintId = detail.body.challenge.hints[0].id as string;
    const res = await player.post(`/api/v1/challenges/${challengeId}/hints/${hintId}/unlock`);
    expect(res.status).toBe(403);
  });

  it('404s for a hint that belongs to another challenge', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');
    const a = await createTestChallenge(adminAgent, categoryId);
    const b = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Other ${Date.now()}`,
      description: 'Other.',
      categoryId,
      points: 10,
      published: true,
      flags: [{ value: 'YourCTF{other_hint_flag}', points: 10 }],
      hints: [{ content: 'Other clue', cost: 1 }],
    });
    const detail = await request(app).get(`/api/v1/challenges/${b.body.challenge.id}`);
    const hintId = detail.body.challenge.hints[0].id as string;

    const player = newAgent();
    await registerUser(player);
    const res = await player.post(`/api/v1/challenges/${a.id}/hints/${hintId}/unlock`);
    expect(res.status).toBe(404);
  });
});
