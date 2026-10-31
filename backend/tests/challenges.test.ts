import { describe, expect, it } from 'vitest';
import { createTestChallenge, ensureCategory, makeAdmin, newAgent } from './helpers.js';
import request from 'supertest';
import { app } from './helpers.js';

describe('challenges', () => {
  it('lists published challenges without leaking flag material', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Web');
    const challenge = await createTestChallenge(adminAgent, categoryId, {
      flagValue: 'YourCTF{sup3r_s3cret_leak_check}',
    });

    const res = await request(app).get('/api/v1/challenges');
    expect(res.status).toBe(200);
    const found = res.body.challenges.find((c: { id: string }) => c.id === challenge.id);
    expect(found).toBeDefined();
    expect(found).toMatchObject({ flagsTotal: 1, solvedByMe: false });

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('sup3r_s3cret_leak_check');
    expect(serialized).not.toContain('"hash"');
    expect(serialized).not.toContain('"salt"');
  });

  it('filters by category slug', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const webId = await ensureCategory(adminAgent, 'Web');
    const cryptoId = await ensureCategory(adminAgent, 'Crypto');
    await createTestChallenge(adminAgent, webId);
    const cryptoChallenge = await createTestChallenge(adminAgent, cryptoId);

    const res = await request(app).get('/api/v1/challenges?category=crypto');
    expect(res.status).toBe(200);
    expect(res.body.challenges.length).toBeGreaterThan(0);
    expect(res.body.challenges.every((c: { category: { slug: string } }) => c.category.slug === 'crypto')).toBe(true);
    expect(res.body.challenges.some((c: { id: string }) => c.id === cryptoChallenge.id)).toBe(true);
  });

  it('returns detail with hints, files and per-flag solve state', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Forensics');
    const created = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Detailed ${Date.now()}`,
      description: 'Detail page body.',
      categoryId,
      points: 150,
      published: true,
      flags: [{ label: 'Task 1', value: 'YourCTF{detail_task}', points: 150 }],
      hints: [{ content: 'Look closer.', cost: 0 }],
      files: [{ name: 'dump.raw', path: 'files/forensics/dump.raw' }],
    });
    expect(created.status).toBe(201);

    const res = await request(app).get(`/api/v1/challenges/${created.body.challenge.id}`);
    expect(res.status).toBe(200);
    expect(res.body.challenge).toMatchObject({
      description: 'Detail page body.',
      hints: [{ content: 'Look closer.' }],
      files: [{ name: 'dump.raw' }],
    });
    expect(res.body.challenge.flags[0]).toMatchObject({ label: 'Task 1', solvedByMe: false });
    expect(JSON.stringify(res.body)).not.toContain('YourCTF{detail_task}');
  });

  it('404s for unknown and unpublished challenges', async () => {
    const adminAgent = newAgent();
    await makeAdmin(adminAgent);
    const categoryId = await ensureCategory(adminAgent, 'Misc');
    const hidden = await adminAgent.post('/api/v1/admin/challenges').send({
      title: `Hidden ${Date.now()}`,
      description: 'Not published yet.',
      categoryId,
      points: 50,
      published: false,
      flags: [{ value: 'YourCTF{hidden_one}', points: 50 }],
    });
    expect(hidden.status).toBe(201);

    const unknown = await request(app).get('/api/v1/challenges/does-not-exist');
    expect(unknown.status).toBe(404);
    const unpublished = await request(app).get(`/api/v1/challenges/${hidden.body.challenge.id}`);
    expect(unpublished.status).toBe(404);
  });
});
