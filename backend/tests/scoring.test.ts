import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import {
  awardFor,
  dynamicPoints,
  scoringConfigFor,
  STATIC_SCORING,
} from '../src/utils/scoring.js';
import { createTestChallenge, ensureCategory, makeAdmin, newAgent, registerUser } from './helpers.js';
import { app } from './helpers.js';
import request from 'supertest';

describe('scoring helpers', () => {
  it('keeps static awards equal to the base value', () => {
    expect(scoringConfigFor(null)).toEqual(STATIC_SCORING);
    expect(scoringConfigFor({ scoringMode: 'STATIC', scoringMinimumPoints: 10, scoringDecayThreshold: 5 }).mode).toBe(
      'static',
    );
    expect(awardFor(STATIC_SCORING, 250, 0)).toBe(250);
    expect(awardFor(STATIC_SCORING, 250, 99)).toBe(250);
  });

  it('decays quadratically from the base to the floor', () => {
    const options = { minimumPoints: 100, decayThreshold: 10 };
    expect(dynamicPoints(500, 1, options)).toBe(500);
    expect(dynamicPoints(500, 10, options)).toBe(100);
    expect(dynamicPoints(500, 50, options)).toBe(100);
    expect(dynamicPoints(500, 2, options)).toBeLessThan(500);
    expect(dynamicPoints(500, 2, options)).toBeGreaterThanOrEqual(100);
  });

  it('never lifts a flag above its base when the floor is higher', () => {
    const options = { minimumPoints: 100, decayThreshold: 10 };
    expect(dynamicPoints(50, 1, options)).toBe(50);
    expect(dynamicPoints(50, 10, options)).toBe(50);
    expect(dynamicPoints(50, 99, options)).toBe(50);
  });
});

describe('dynamic event scoring', () => {
  it('freezes a decaying award on each solve and exposes the current worth', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Dynamic');

    const event = await adminAgent.post('/api/v1/admin/events').send({
      name: `Dynamic night ${Date.now()}`,
      published: true,
      scoringMode: 'DYNAMIC',
      scoringMinimumPoints: 100,
      scoringDecayThreshold: 10,
    });
    expect(event.status).toBe(201);
    expect(event.body.event).toMatchObject({
      scoringMode: 'DYNAMIC',
      scoringMinimumPoints: 100,
      scoringDecayThreshold: 10,
    });

    const flagValue = `YourCTF{dynamic_${Date.now()}}`;
    const created = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Decaying ${Date.now()}`,
      description: 'A challenge that loses value as the board fills up.',
      categoryId,
      eventId: event.body.event.id,
      difficulty: 'medium',
      points: 500,
      published: true,
      flags: [{ value: flagValue, points: 500 }],
    });
    expect(created.status).toBe(201);
    const challengeId = created.body.challenge.id as string;

    const firstAgent = newAgent();
    await registerUser(firstAgent);
    const first = await firstAgent
      .post('/api/v1/submissions')
      .send({ challengeId, flag: flagValue });
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ correct: true, points: 500, firstBlood: true });

    const secondAgent = newAgent();
    await registerUser(secondAgent);
    const second = await secondAgent
      .post('/api/v1/submissions')
      .send({ challengeId, flag: flagValue });
    expect(second.status).toBe(200);
    expect(second.body.correct).toBe(true);
    const expectedSecond = dynamicPoints(500, 2, { minimumPoints: 100, decayThreshold: 10 });
    expect(second.body.points).toBe(expectedSecond);
    expect(second.body.points).toBeLessThan(500);

    const solves = await prisma.solve.findMany({
      where: { challengeId },
      orderBy: { points: 'desc' },
      select: { points: true },
    });
    expect(solves.map((solve) => solve.points)).toEqual([500, expectedSecond]);

    const detail = await request(app).get(`/api/v1/challenges/${challengeId}`);
    expect(detail.status).toBe(200);
    const nextWorth = dynamicPoints(500, 3, { minimumPoints: 100, decayThreshold: 10 });
    expect(detail.body.challenge.currentPoints).toBe(nextWorth);
    expect(detail.body.challenge.flags[0].currentPoints).toBe(nextWorth);

    const adminDetail = await adminAgent.get(`/api/v1/admin/challenges/${challengeId}`);
    expect(adminDetail.status).toBe(200);
    expect(adminDetail.body.challenge.scoring).toMatchObject({
      mode: 'DYNAMIC',
      minimumPoints: 100,
      decayThreshold: 10,
    });
    expect(adminDetail.body.challenge.scoring.samples).toContainEqual({ solves: 10, points: 100 });
  });

  it('defaults new events to static scoring', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const event = await adminAgent.post('/api/v1/admin/events').send({
      name: `Static night ${Date.now()}`,
    });
    expect(event.status).toBe(201);
    expect(event.body.event).toMatchObject({
      scoringMode: 'STATIC',
      scoringMinimumPoints: 100,
      scoringDecayThreshold: 40,
    });

    const categoryId = await ensureCategory(adminAgent, 'Dynamic');
    const challenge = await createTestChallenge(adminAgent, categoryId, { points: 80 });
    const agent = newAgent();
    await registerUser(agent);
    const solved = await agent
      .post('/api/v1/submissions')
      .send({ challengeId: challenge.id, flag: challenge.flagValue });
    expect(solved.body.points).toBe(80);
  });
});
