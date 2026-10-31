import type { Challenge, ChallengeFile, Flag, Hint, User } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { downloadUrlFor } from '../../utils/files.js';
import { awardFor, scoringConfigFor } from '../../utils/scoring.js';
import type { ListChallengesQuery } from './challenges.schema.js';

type EventScoring = {
  scoringMode: string;
  scoringMinimumPoints: number;
  scoringDecayThreshold: number;
};

type ChallengeWithRelations = Challenge & {
  category: { id: string; name: string; slug: string; color: string | null };
  event: EventScoring | null;
  flags: Flag[];
  hints: Hint[];
  files: (ChallengeFile & { asset: { mimeType: string } | null })[];
  solves: { flagId: string; userId: string; firstBlood: boolean }[];
};

const include = {
  category: { select: { id: true, name: true, slug: true, color: true } },
  event: {
    select: { scoringMode: true, scoringMinimumPoints: true, scoringDecayThreshold: true },
  },
  flags: true,
  hints: { orderBy: { order: 'asc' as const } },
  files: { include: { asset: { select: { mimeType: true } } } },
  solves: { select: { flagId: true, userId: true, firstBlood: true } },
};

export interface ChallengeSummary {
  id: string;
  title: string;
  difficulty: string;
  /** Base value from the challenge configuration. */
  points: number;
  /** What the next solver earns right now (equal to points for static events). */
  currentPoints: number;
  order: number;
  category: { id: string; name: string; slug: string; color: string | null };
  eventId: string | null;
  flagsTotal: number;
  flagsSolved: number;
  solveCount: number;
  solvedByMe: boolean;
  firstBloodByMe: boolean;
}

export interface HintView {
  id: string;
  order: number;
  cost: number;
  unlocked: boolean;
  /** Null while locked: paid hint text never leaves the server unearned. */
  content: string | null;
}

export interface ChallengeDetail extends ChallengeSummary {
  description: string;
  hints: HintView[];
  files: {
    id: string;
    name: string;
    path: string | null;
    sizeBytes: number | null;
    mimeType: string | null;
    downloadUrl: string | null;
  }[];
  flags: {
    id: string;
    label: string | null;
    points: number;
    currentPoints: number;
    order: number;
    solvedByMe: boolean;
    firstBlood: boolean;
  }[];
}

function solveCounts(challenge: ChallengeWithRelations): Map<string, number> {
  const counts = new Map<string, number>();
  for (const solve of challenge.solves) {
    counts.set(solve.flagId, (counts.get(solve.flagId) ?? 0) + 1);
  }
  return counts;
}

function currentPointsFor(challenge: ChallengeWithRelations, flag: Flag, counts: Map<string, number>): number {
  const scoring = scoringConfigFor(challenge.event);
  return awardFor(scoring, flag.points, counts.get(flag.id) ?? 0);
}

function summarize(challenge: ChallengeWithRelations, user: User | null): ChallengeSummary {
  const mySolveFlagIds = new Set(
    user ? challenge.solves.filter((s) => s.userId === user.id).map((s) => s.flagId) : [],
  );
  const uniqueSolvers = new Set(challenge.solves.map((s) => s.userId));
  const counts = solveCounts(challenge);
  const currentPoints = challenge.flags.reduce(
    (total, flag) => total + currentPointsFor(challenge, flag, counts),
    0,
  );

  return {
    id: challenge.id,
    title: challenge.title,
    difficulty: challenge.difficulty,
    points: challenge.points,
    currentPoints,
    order: challenge.order,
    category: challenge.category,
    eventId: challenge.eventId,
    flagsTotal: challenge.flags.length,
    flagsSolved: challenge.solves.length,
    solveCount: uniqueSolvers.size,
    solvedByMe: user ? challenge.flags.every((f) => mySolveFlagIds.has(f.id)) : false,
    firstBloodByMe: user ? challenge.solves.some((s) => s.userId === user.id && s.firstBlood) : false,
  };
}

function detail(
  challenge: ChallengeWithRelations,
  user: User | null,
  unlockedHintIds: ReadonlySet<string> = new Set(),
): ChallengeDetail {
  const mySolveFlagIds = new Set(
    user ? challenge.solves.filter((s) => s.userId === user.id).map((s) => s.flagId) : [],
  );
  const counts = solveCounts(challenge);

  return {
    ...summarize(challenge, user),
    description: challenge.description,
    hints: challenge.hints.map((h) => {
      const unlocked = h.cost <= 0 || unlockedHintIds.has(h.id);
      return {
        id: h.id,
        order: h.order,
        cost: h.cost,
        unlocked,
        content: unlocked ? h.content : null,
      };
    }),
    files: challenge.files.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      sizeBytes: f.sizeBytes,
      mimeType: f.asset?.mimeType ?? null,
      downloadUrl: f.assetId ? downloadUrlFor(f.assetId) : null,
    })),
    // Flag values, salts and hashes are never serialized.
    flags: challenge.flags.map((f) => ({
      id: f.id,
      label: f.label,
      points: f.points,
      currentPoints: currentPointsFor(challenge, f, counts),
      order: f.order,
      solvedByMe: mySolveFlagIds.has(f.id),
      firstBlood: challenge.solves.some((s) => s.flagId === f.id && s.firstBlood),
    })),
  };
}

export async function listChallenges(
  query: ListChallengesQuery,
  user: User | null,
): Promise<ChallengeSummary[]> {
  const challenges = await prisma.challenge.findMany({
    where: {
      published: true,
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.eventId ? { eventId: query.eventId } : {}),
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    },
    include,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  return challenges.map((c) => summarize(c, user));
}

export async function getChallenge(id: string, user: User | null): Promise<ChallengeDetail> {
  const challenge = await prisma.challenge.findUnique({ where: { id }, include });
  if (!challenge || !challenge.published) throw new HttpError(404, 'Challenge not found');

  let unlocked = new Set<string>();
  if (user) {
    const rows = await prisma.hintUnlock.findMany({
      where: { payerKey: payerKey(user), hintId: { in: challenge.hints.map((h) => h.id) } },
      select: { hintId: true },
    });
    unlocked = new Set(rows.map((row) => row.hintId));
  }

  return detail(challenge, user, unlocked);
}

/** Team members share one hint ledger; solo players are billed personally. */
function payerKey(user: User): string {
  return user.teamId ? `team:${user.teamId}` : `user:${user.id}`;
}

async function availablePoints(user: User): Promise<number> {
  const where = user.teamId ? { teamId: user.teamId } : { userId: user.id };
  const [solves, spends] = await Promise.all([
    prisma.solve.aggregate({ where, _sum: { points: true } }),
    prisma.hintUnlock.aggregate({ where: { payerKey: payerKey(user) }, _sum: { pointsSpent: true } }),
  ]);
  return (solves._sum.points ?? 0) - (spends._sum.pointsSpent ?? 0);
}

export interface UnlockHintResult {
  hint: HintView;
  alreadyUnlocked: boolean;
  pointsSpent: number;
  /** Score remaining after this unlock. */
  points: number;
}

export async function unlockHint(
  user: User,
  challengeId: string,
  hintId: string,
): Promise<UnlockHintResult> {
  const hint = await prisma.hint.findFirst({
    where: { id: hintId, challengeId },
    include: { challenge: { select: { published: true, event: { select: { endsAt: true } } } } },
  });
  if (!hint || !hint.challenge.published) throw new HttpError(404, 'Hint not found');

  const endsAt = hint.challenge.event?.endsAt;
  if (endsAt && endsAt.getTime() < Date.now()) {
    throw new HttpError(403, 'This competition has ended');
  }

  const openHint: HintView = {
    id: hint.id,
    order: hint.order,
    cost: hint.cost,
    unlocked: true,
    content: hint.content,
  };

  if (hint.cost <= 0) {
    return { hint: openHint, alreadyUnlocked: true, pointsSpent: 0, points: await availablePoints(user) };
  }

  const key = payerKey(user);
  const existing = await prisma.hintUnlock.findUnique({
    where: { hintId_payerKey: { hintId, payerKey: key } },
  });
  if (existing) {
    return { hint: openHint, alreadyUnlocked: true, pointsSpent: 0, points: await availablePoints(user) };
  }

  const points = await availablePoints(user);
  if (points < hint.cost) {
    throw new HttpError(409, 'Not enough points to unlock this hint', {
      code: 'INSUFFICIENT_POINTS',
      points,
    });
  }

  try {
    await prisma.hintUnlock.create({
      data: {
        hintId,
        challengeId,
        userId: user.id,
        teamId: user.teamId,
        payerKey: key,
        pointsSpent: hint.cost,
      },
    });
  } catch (error) {
    // A teammate unlocked the same hint between our read and write.
    if ((error as { code?: string }).code !== 'P2002') throw error;
    return { hint: openHint, alreadyUnlocked: true, pointsSpent: 0, points };
  }

  return { hint: openHint, alreadyUnlocked: false, pointsSpent: hint.cost, points: points - hint.cost };
}
