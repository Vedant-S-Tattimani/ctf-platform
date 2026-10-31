import type { Agent } from 'supertest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

export const app = createApp();

export function newAgent(): Agent {
  return request.agent(app);
}

export interface TestUser {
  id: string;
  username: string;
  email: string;
}

export function credentials(seed = Math.random().toString(36).slice(2, 8)) {
  return {
    username: `player_${seed}`,
    email: `player_${seed}@example.com`,
    password: 'Str0ngPass!word',
  };
}

export async function registerUser(agent: Agent, seed?: string): Promise<TestUser> {
  const res = await agent.post('/api/v1/auth/register').send(credentials(seed));
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.user as TestUser;
}

export async function makeAdmin(agent: Agent, seed?: string): Promise<TestUser> {
  const user = await registerUser(agent, seed);
  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  return user;
}

export async function ensureCategory(adminAgent: Agent, name: string): Promise<string> {
  const created = await adminAgent.post('/api/v1/admin/categories').send({ name });
  if (created.status === 201) return created.body.category.id as string;
  const list = await adminAgent.get('/api/v1/admin/categories');
  const found = (list.body.categories as { id: string; name: string }[]).find((c) => c.name === name);
  if (!found) throw new Error(`category ${name} missing`);
  return found.id;
}

export interface TestChallenge {
  id: string;
  flagValue: string;
  points: number;
}

export async function createTestChallenge(
  adminAgent: Agent,
  categoryId: string,
  opts: { flagValue?: string; points?: number; published?: boolean; title?: string } = {},
): Promise<TestChallenge> {
  const flagValue = opts.flagValue ?? `YourCTF{test_${Math.random().toString(36).slice(2, 8)}}`;
  const points = opts.points ?? 100;
  const res = await adminAgent.post('/api/v1/admin/challenges').send({
    title: opts.title ?? `Test challenge ${Math.random().toString(36).slice(2, 8)}`,
    description: 'A challenge created by the test suite.',
    categoryId,
    points,
    published: opts.published ?? true,
    flags: [{ value: flagValue, points }],
  });
  if (res.status !== 201) {
    throw new Error(`create challenge failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { id: res.body.challenge.id as string, flagValue, points };
}
