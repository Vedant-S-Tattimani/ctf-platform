import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import { createTestChallenge, ensureCategory, makeAdmin, newAgent, registerUser } from './helpers.js';
import { app } from './helpers.js';

async function setup() {
  const adminAgent = newAgent();
  await makeAdmin(adminAgent);
  const categoryId = await ensureCategory(adminAgent, 'Hashconfig');
  return { adminAgent, categoryId };
}

describe('flag hashing configuration', () => {
  it('verifies flags hashed with sha512 and records the algorithm', async () => {
    const { adminAgent, categoryId } = await setup();
    const flagValue = `YourCTF{sha512_${Date.now()}}`;
    const created = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Sha512 ${Date.now()}`,
      description: 'Uses a stronger hash algorithm.',
      categoryId,
      points: 60,
      published: true,
      flags: [{ value: flagValue, points: 60, algo: 'sha512' }],
    });
    expect(created.status).toBe(201);

    const flag = await prisma.flag.findFirst({ where: { challengeId: created.body.challenge.id } });
    expect(flag?.algo).toBe('sha512');
    expect(flag?.hash).toHaveLength(128);
    expect(flag?.hash).not.toContain(flagValue);

    const agent = newAgent();
    await registerUser(agent);
    const solved = await agent
      .post('/api/v1/submissions')
      .send({ challengeId: created.body.challenge.id, flag: flagValue });
    expect(solved.status).toBe(200);
    expect(solved.body).toMatchObject({ correct: true, points: 60 });
  });

  it('defaults to sha256 when the algorithm is omitted', async () => {
    const { adminAgent, categoryId } = await setup();
    const challenge = await createTestChallenge(adminAgent, categoryId);
    const flag = await prisma.flag.findFirst({ where: { challengeId: challenge.id } });
    expect(flag?.algo).toBe('sha256');
    expect(flag?.hash).toHaveLength(64);
  });

  it('never exposes a wrong attempt as plaintext anywhere', async () => {
    const { adminAgent, categoryId } = await setup();
    const challenge = await createTestChallenge(adminAgent, categoryId);
    const attempt = 'YourCTF{definitely_wrong_guess}';

    const agent = newAgent();
    const player = await registerUser(agent);
    const res = await agent
      .post('/api/v1/submissions')
      .send({ challengeId: challenge.id, flag: attempt });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ correct: false });
    expect(JSON.stringify(res.body)).not.toContain('definitely_wrong_guess');

    const row = await prisma.submission.findFirst({
      where: { userId: player.id, correct: false },
    });
    expect(row?.providedLength).toBe(attempt.length);
    expect(row?.providedSalt).toBeTruthy();
    expect(row?.providedHash).toBeTruthy();
    expect(JSON.stringify(row)).not.toContain('definitely_wrong_guess');

    const mine = await agent.get('/api/v1/submissions/me');
    expect(mine.body.submissions[0]).toMatchObject({
      correct: false,
      providedLength: attempt.length,
      providedHashPrefix: null,
    });
    expect(JSON.stringify(mine.body)).not.toContain('definitely_wrong_guess');

    const adminView = await adminAgent.get('/api/v1/admin/submissions');
    expect(JSON.stringify(adminView.body)).not.toContain('definitely_wrong_guess');
    const listed = (adminView.body.submissions as { providedLength: number | null }[]).find(
      (entry) => entry.providedLength === attempt.length,
    );
    expect(listed).toBeTruthy();
  });
});
