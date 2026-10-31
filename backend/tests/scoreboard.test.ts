import { describe, expect, it } from 'vitest';
import {
  createTestChallenge,
  credentials,
  ensureCategory,
  makeAdmin,
  newAgent,
} from './helpers.js';
import request from 'supertest';
import { app } from './helpers.js';

interface Entry {
  rank: number;
  name: string;
  points: number;
}

async function setupScored() {
  const adminAgent = newAgent();
  await makeAdmin(adminAgent);
  const categoryId = await ensureCategory(adminAgent, 'Reverse');
  const cheap = await createTestChallenge(adminAgent, categoryId, { points: 100 });
  const pricey = await createTestChallenge(adminAgent, categoryId, { points: 300 });

  const stamp = Date.now();
  const teamA = `Alpha ${stamp}`;
  const teamB = `Bravo ${stamp}`;

  const agentA = newAgent();
  await agentA.post('/api/v1/auth/register').send(credentials(`sb_a_${stamp}`)).expect(201);
  await agentA.post('/api/v1/teams').send({ name: teamA }).expect(201);
  await agentA.post('/api/v1/submissions').send({ challengeId: cheap.id, flag: cheap.flagValue }).expect(200);

  const agentB = newAgent();
  await agentB.post('/api/v1/auth/register').send(credentials(`sb_b_${stamp}`)).expect(201);
  await agentB.post('/api/v1/teams').send({ name: teamB }).expect(201);
  await agentB.post('/api/v1/submissions').send({ challengeId: pricey.id, flag: pricey.flagValue }).expect(200);

  return { teamA, teamB };
}

describe('scoreboard', () => {
  it('ranks teams by points', async () => {
    const { teamA, teamB } = await setupScored();

    const res = await request(app).get('/api/v1/scoreboard?scope=teams');
    expect(res.status).toBe(200);
    const entries = res.body.entries as Entry[];
    const a = entries.find((e) => e.name === teamA);
    const b = entries.find((e) => e.name === teamB);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(b!.points).toBe(300);
    expect(a!.points).toBe(100);
    expect(b!.rank).toBeLessThan(a!.rank);
    expect(b!.memberCount).toBe(1);
  });

  it('ranks individual users too', async () => {
    const stamp = Date.now();
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Crypto');
    const challenge = await createTestChallenge(adminAgent, categoryId, { points: 77 });

    const agent = newAgent();
    const creds = credentials(`solo_${stamp}`);
    await agent.post('/api/v1/auth/register').send(creds).expect(201);
    await agent.post('/api/v1/submissions').send({ challengeId: challenge.id, flag: challenge.flagValue }).expect(200);

    const res = await request(app).get('/api/v1/scoreboard?scope=users');
    expect(res.status).toBe(200);
    const me = (res.body.entries as Entry[]).find((e) => e.name === creds.username);
    expect(me).toBeDefined();
    expect(me!.points).toBe(77);
  });

  it('returns a cumulative points-over-time series for the chart', async () => {
    const { teamB } = await setupScored();

    const res = await request(app).get('/api/v1/scoreboard/history?scope=teams');
    expect(res.status).toBe(200);
    const series = res.body.series as { name: string; points: { t: string; y: number }[] }[];
    expect(series.length).toBeGreaterThan(0);
    const top = series.find((s) => s.name === teamB);
    expect(top).toBeDefined();
    expect(top!.points[0]).toMatchObject({ y: 0 });
    expect(top!.points.at(-1)).toMatchObject({ y: 300 });
  });
});
