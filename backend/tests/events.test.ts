import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/db/prisma.js';
import { app, createTestChallenge, ensureCategory, makeAdmin, newAgent } from './helpers.js';

interface Body {
  event: {
    id: string;
    name: string;
    state: string;
    challengeCount: number;
    teamMaxSize: number;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
  serverTime: string;
}

const HOUR = 60 * 60 * 1000;

async function publishEvent(
  admin: ReturnType<typeof newAgent>,
  data: { name: string; startsAt: Date | null; endsAt: Date | null; published: boolean },
) {
  const res = await admin.post('/api/v1/admin/events').send(data);
  if (res.status !== 201) {
    throw new Error(`create event failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.event.id as string;
}

describe('GET /events/current', () => {
  beforeEach(async () => {
    await prisma.event.updateMany({ data: { published: false } });
  });

  it('returns null and a server clock when nothing is published', async () => {
    const res = await request(app).get('/api/v1/events/current');
    expect(res.status).toBe(200);
    expect(res.body.event).toBeNull();
    expect(Number.isNaN(Date.parse(res.body.serverTime as string))).toBe(false);
  });

  it('never returns draft events', async () => {
    const admin = newAgent();
    await makeAdmin(admin);
    await publishEvent(admin, {
      name: `Draft ${Date.now()}`,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 4 * HOUR),
      published: false,
    });

    const res = await request(app).get('/api/v1/events/current');
    expect(res.status).toBe(200);
    expect(res.body.event).toBeNull();
  });

  it('prefers a live event over upcoming and ended ones', async () => {
    const admin = newAgent();
    await makeAdmin(admin);
    const stamp = Date.now();
    const now = Date.now();

    await publishEvent(admin, {
      name: `Ended ${stamp}`,
      startsAt: new Date(now - 48 * HOUR),
      endsAt: new Date(now - 24 * HOUR),
      published: true,
    });
    const liveId = await publishEvent(admin, {
      name: `Live ${stamp}`,
      startsAt: new Date(now - HOUR),
      endsAt: new Date(now + 6 * HOUR),
      published: true,
    });
    await publishEvent(admin, {
      name: `Upcoming ${stamp}`,
      startsAt: new Date(now + 24 * HOUR),
      endsAt: new Date(now + 48 * HOUR),
      published: true,
    });

    const res = await request(app).get('/api/v1/events/current');
    expect(res.status).toBe(200);
    const body = res.body as Body;
    expect(body.event?.id).toBe(liveId);
    expect(body.event?.state).toBe('live');
    expect(body.event?.teamMaxSize).toBeGreaterThan(0);
  });

  it('falls back to the next upcoming event, then the last ended one', async () => {
    const admin = newAgent();
    await makeAdmin(admin);
    const now = Date.now();
    const endedId = await publishEvent(admin, {
      name: `Only ended ${now}`,
      startsAt: new Date(now - 48 * HOUR),
      endsAt: new Date(now - 24 * HOUR),
      published: true,
    });
    const upcomingId = await publishEvent(admin, {
      name: `Only upcoming ${now}`,
      startsAt: new Date(now + 24 * HOUR),
      endsAt: new Date(now + 48 * HOUR),
      published: true,
    });

    const withUpcoming = await request(app).get('/api/v1/events/current');
    expect(withUpcoming.body.event?.id).toBe(upcomingId);
    expect(withUpcoming.body.event?.state).toBe('upcoming');

    await prisma.event.update({ where: { id: upcomingId }, data: { published: false } });
    const withEnded = await request(app).get('/api/v1/events/current');
    expect(withEnded.body.event?.id).toBe(endedId);
    expect(withEnded.body.event?.state).toBe('ended');
  });

  it('counts only published challenges and leaks nothing secret', async () => {
    const admin = newAgent();
    await makeAdmin(admin);
    const categoryId = await ensureCategory(admin, 'Web');
    const eventId = await publishEvent(admin, {
      name: `Counted ${Date.now()}`,
      startsAt: new Date(Date.now() - HOUR),
      endsAt: new Date(Date.now() + 6 * HOUR),
      published: true,
    });

    const published = await createTestChallenge(admin, categoryId, { published: true });
    const draft = await createTestChallenge(admin, categoryId, { published: false });
    for (const id of [published.id, draft.id]) {
      await prisma.challenge.update({ where: { id }, data: { eventId } });
    }

    const res = await request(app).get('/api/v1/events/current');
    expect(res.status).toBe(200);
    const body = res.body as Body;
    expect(body.event?.id).toBe(eventId);
    expect(body.event?.challengeCount).toBe(1);
    expect(JSON.stringify(res.body)).not.toMatch(/YourCTF\{|salt|hash/i);
  });
});
