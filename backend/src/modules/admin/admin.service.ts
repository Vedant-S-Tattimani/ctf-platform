import { unlinkSync } from 'node:fs';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { downloadUrlFor, resolveStoredFile } from '../../utils/files.js';
import { hashFlag, newSalt } from '../../utils/hash.js';
import { dynamicPoints } from '../../utils/scoring.js';
import type {
  AddFileInput,
  AddHintInput,
  CreateCategoryInput,
  CreateChallengeInput,
  CreateEventInput,
  FlagInput,
  ListQuery,
  UpdateCategoryInput,
  UpdateChallengeInput,
  UpdateEventInput,
} from './admin.schema.js';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function flagData(flag: FlagInput, order: number) {
  const salt = newSalt();
  const algo = flag.algo ?? env.FLAG_HASH_ALGORITHM;
  return {
    label: flag.label ?? null,
    salt,
    hash: hashFlag(flag.value, salt, algo),
    algo,
    points: flag.points,
    order,
  };
}

// --- challenges ---

export async function listChallenges() {
  return prisma.challenge.findMany({
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
      event: { select: { id: true, name: true } },
      _count: { select: { flags: true, hints: true, files: true, solves: true } },
    },
    orderBy: [{ eventId: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function getChallenge(challengeId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
      event: {
        select: {
          id: true,
          name: true,
          scoringMode: true,
          scoringMinimumPoints: true,
          scoringDecayThreshold: true,
        },
      },
      flags: {
        select: { id: true, label: true, points: true, order: true, algo: true },
        orderBy: { order: 'asc' },
      },
      hints: { select: { id: true, content: true, cost: true, order: true }, orderBy: { order: 'asc' } },
      files: {
        select: {
          id: true,
          name: true,
          path: true,
          sizeBytes: true,
          assetId: true,
          asset: { select: { mimeType: true } },
        },
      },
      _count: { select: { solves: true } },
    },
  });
  if (!challenge) throw new HttpError(404, 'Challenge not found');

  const event = challenge.event;
  const scoring =
    event && event.scoringMode === 'DYNAMIC'
      ? {
          mode: 'DYNAMIC' as const,
          minimumPoints: event.scoringMinimumPoints,
          decayThreshold: event.scoringDecayThreshold,
          samples: [...new Set([1, 5, 10, 25, event.scoringDecayThreshold])]
            .sort((a, b) => a - b)
            .map((solves) => ({
              solves,
              points: dynamicPoints(challenge.points, solves, {
                minimumPoints: event.scoringMinimumPoints,
                decayThreshold: event.scoringDecayThreshold,
              }),
            })),
        }
      : null;

  return {
    ...challenge,
    files: challenge.files.map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      sizeBytes: file.sizeBytes,
      mimeType: file.asset?.mimeType ?? null,
      downloadUrl: file.assetId ? downloadUrlFor(file.assetId) : null,
    })),
    scoring,
  };
}

export async function createChallenge(input: CreateChallengeInput) {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new HttpError(404, 'Category not found');
  if (input.eventId) {
    const event = await prisma.event.findUnique({ where: { id: input.eventId } });
    if (!event) throw new HttpError(404, 'Event not found');
  }

  return prisma.challenge.create({
    data: {
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      eventId: input.eventId ?? null,
      difficulty: input.difficulty,
      points: input.points,
      published: input.published,
      order: input.order,
      flags: { create: input.flags.map((f, i) => flagData(f, i)) },
      hints: { create: input.hints.map((h, i) => ({ content: h.content, cost: h.cost, order: i })) },
      files: { create: input.files.map((f) => ({ name: f.name, path: f.path, sizeBytes: f.sizeBytes ?? null })) },
    },
    include: { flags: { select: { id: true, label: true, points: true, order: true } } },
  });
}

export async function updateChallenge(id: string, input: UpdateChallengeInput) {
  const existing = await prisma.challenge.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Challenge not found');
  return prisma.challenge.update({ where: { id }, data: { ...input } });
}

export async function deleteChallenge(id: string) {
  const existing = await prisma.challenge.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Challenge not found');
  await prisma.challenge.delete({ where: { id } });
  return { ok: true as const };
}

export async function addFlag(challengeId: string, input: FlagInput) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId }, include: { _count: { select: { flags: true } } } });
  if (!challenge) throw new HttpError(404, 'Challenge not found');
  return prisma.flag.create({
    data: { ...flagData(input, challenge._count.flags), challengeId },
    select: { id: true, label: true, points: true, order: true },
  });
}

export async function deleteFlag(flagId: string) {
  const solves = await prisma.solve.count({ where: { flagId } });
  if (solves > 0) throw new HttpError(409, 'Flag already has solves; remove those first');
  await prisma.flag.delete({ where: { id: flagId } });
  return { ok: true as const };
}

export async function addHint(challengeId: string, input: AddHintInput) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId }, include: { _count: { select: { hints: true } } } });
  if (!challenge) throw new HttpError(404, 'Challenge not found');
  return prisma.hint.create({ data: { ...input, order: challenge._count.hints, challengeId } });
}

export async function deleteHint(hintId: string) {
  await prisma.hint.delete({ where: { id: hintId } });
  return { ok: true as const };
}

export async function addFile(challengeId: string, input: AddFileInput) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw new HttpError(404, 'Challenge not found');

  if (input.assetId) {
    const asset = await prisma.fileAsset.findUnique({ where: { id: input.assetId } });
    if (!asset) throw new HttpError(404, 'Upload not found');
    const file = await prisma.challengeFile.create({
      data: {
        name: asset.name,
        path: null,
        sizeBytes: asset.sizeBytes,
        assetId: asset.id,
        challengeId,
      },
    });
    return {
      ...file,
      mimeType: asset.mimeType,
      downloadUrl: downloadUrlFor(asset.id),
    };
  }

  const file = await prisma.challengeFile.create({
    data: {
      name: input.name!,
      path: input.path!,
      sizeBytes: input.sizeBytes ?? null,
      challengeId,
    },
  });
  return { ...file, mimeType: null, downloadUrl: null };
}

export async function deleteFile(fileId: string) {
  const file = await prisma.challengeFile.findUnique({ where: { id: fileId } });
  if (!file) throw new HttpError(404, 'File not found');
  await prisma.challengeFile.delete({ where: { id: fileId } });

  if (file.assetId) {
    const remaining = await prisma.challengeFile.count({ where: { assetId: file.assetId } });
    if (remaining === 0) {
      const asset = await prisma.fileAsset.delete({ where: { id: file.assetId } });
      try {
        unlinkSync(resolveStoredFile(asset.storedName));
      } catch {
        /* the row is gone; an already-missing file is fine */
      }
    }
  }
  return { ok: true as const };
}

// --- categories ---

export async function listCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { challenges: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug ?? slugify(input.name);
  const taken = await prisma.category.findFirst({ where: { OR: [{ slug }, { name: input.name }] } });
  if (taken) throw new HttpError(409, 'Category name or slug taken');
  return prisma.category.create({
    data: { name: input.name, slug, color: input.color ?? null, icon: input.icon ?? null },
  });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Category not found');
  return prisma.category.update({ where: { id }, data: { ...input } });
}

export async function deleteCategory(id: string) {
  const challenges = await prisma.challenge.count({ where: { categoryId: id } });
  if (challenges > 0) throw new HttpError(409, 'Category still has challenges');
  await prisma.category.delete({ where: { id } });
  return { ok: true as const };
}

// --- events ---

export async function listEvents() {
  return prisma.event.findMany({
    include: { _count: { select: { challenges: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createEvent(input: CreateEventInput) {
  const slug = input.slug ?? slugify(input.name);
  const taken = await prisma.event.findUnique({ where: { slug } });
  if (taken) throw new HttpError(409, 'Event slug taken');
  return prisma.event.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      teamMaxSize: input.teamMaxSize,
      published: input.published,
      scoringMode: input.scoringMode,
      scoringMinimumPoints: input.scoringMinimumPoints,
      scoringDecayThreshold: input.scoringDecayThreshold,
    },
  });
}

export async function updateEvent(id: string, input: UpdateEventInput) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Event not found');
  return prisma.event.update({ where: { id }, data: { ...input } });
}

// --- listings ---

export async function listUsers(query: ListQuery) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        team: { select: { id: true, name: true } },
        _count: { select: { solves: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: query.offset,
      take: query.limit,
    }),
    prisma.user.count(),
  ]);
  return { users, total };
}

export async function listTeams(query: ListQuery) {
  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      include: { _count: { select: { members: true, solves: true } }, owner: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: query.offset,
      take: query.limit,
    }),
    prisma.team.count(),
  ]);
  return { teams, total };
}

export async function listSubmissions(query: ListQuery) {
  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      include: {
        user: { select: { username: true } },
        team: { select: { name: true } },
        challenge: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: query.offset,
      take: query.limit,
    }),
    prisma.submission.count(),
  ]);
  return {
    submissions: submissions.map((s) => ({
      id: s.id,
      correct: s.correct,
      providedLength: s.providedLength,
      providedHashPrefix:
        env.WRONG_ATTEMPT_DISPLAY_PREFIX && s.providedHash ? s.providedHash.slice(0, 8) : null,
      createdAt: s.createdAt,
      user: s.user.username,
      team: s.team?.name ?? null,
      challenge: s.challenge.title,
    })),
    total,
  };
}
