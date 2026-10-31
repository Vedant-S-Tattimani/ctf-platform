import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import {
  createTestChallenge,
  ensureCategory,
  makeAdmin,
  newAgent,
  registerUser,
} from './helpers.js';
import request from 'supertest';
import { app } from './helpers.js';

async function setup() {
  const adminAgent = newAgent();
  await makeAdmin(adminAgent);
  const categoryId = await ensureCategory(adminAgent, 'Pwn');
  const challenge = await createTestChallenge(adminAgent, categoryId, {
    flagValue: 'YourCTF{subm1ss1on_test}',
    points: 120,
  });
  const playerAgent = newAgent();
  const player = await registerUser(playerAgent);
  return { challenge, playerAgent, player };
}

describe('submissions', () => {
  it('rejects wrong flags and records the attempt', async () => {
    const { challenge, playerAgent } = await setup();

    const res = await playerAgent
      .post('/api/v1/submissions')
      .send({ challengeId: challenge.id, flag: 'YourCTF{nope}' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ correct: false });

    const history = await playerAgent.get('/api/v1/submissions/me');
    expect(history.status).toBe(200);
    expect(history.body.submissions[0]).toMatchObject({
      correct: false,
      providedLength: 'YourCTF{nope}'.length,
      providedHashPrefix: null,
    });
    expect(history.body.submissions[0]).not.toHaveProperty('provided');
    expect(JSON.stringify(history.body)).not.toContain('YourCTF{nope}');
  });

  it('accepts a correct flag, awards points and marks the challenge solved', async () => {
    const { challenge, playerAgent } = await setup();

    const res = await playerAgent
      .post('/api/v1/submissions')
      .send({ challengeId: challenge.id, flag: challenge.flagValue });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ correct: true, points: 120, firstBlood: true });

    const detail = await playerAgent.get(`/api/v1/challenges/${challenge.id}`);
    expect(detail.body.challenge).toMatchObject({ solvedByMe: true, flagsSolved: 1 });
    expect(detail.body.challenge.flags[0]).toMatchObject({ solvedByMe: true });
  });

  it('blocks duplicate solves with 409 and stores no plaintext flag', async () => {
    const { challenge, playerAgent, player } = await setup();

    await playerAgent
      .post('/api/v1/submissions')
      .send({ challengeId: challenge.id, flag: challenge.flagValue })
      .expect(200);
    const dup = await playerAgent
      .post('/api/v1/submissions')
      .send({ challengeId: challenge.id, flag: challenge.flagValue });
    expect(dup.status).toBe(409);

    const correctSubmission = await prisma.submission.findFirst({
      where: { userId: player.id, correct: true },
    });
    expect(correctSubmission).not.toBeNull();
    expect(correctSubmission?.providedHash).toBeNull();
    expect(correctSubmission?.providedLength).toBeNull();

    const storedFlag = await prisma.flag.findFirst({ where: { challengeId: challenge.id } });
    expect(storedFlag?.hash).not.toBe(challenge.flagValue);
    expect(storedFlag?.salt).toBeTruthy();
  });

  it('requires authentication and validates input', async () => {
    const { challenge } = await setup();

    const anonymous = await request(app)
      .post('/api/v1/submissions')
      .send({ challengeId: challenge.id, flag: 'x' });
    expect(anonymous.status).toBe(401);

    const agent = newAgent();
    await registerUser(agent);
    const bad = await agent.post('/api/v1/submissions').send({ challengeId: '', flag: '' });
    expect(bad.status).toBe(400);
  });

  it('refuses submissions for unknown challenges', async () => {
    const agent = newAgent();
    await registerUser(agent);
    const res = await agent
      .post('/api/v1/submissions')
      .send({ challengeId: 'missing', flag: 'YourCTF{x}' });
    expect(res.status).toBe(404);
  });
});
