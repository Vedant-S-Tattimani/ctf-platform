import type { User } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { hashAttempt, newSalt, normalizeFlag, verifyFlag, type FlagHashAlgorithm } from '../../utils/hash.js';
import { awardFor, scoringConfigFor } from '../../utils/scoring.js';
import type { SubmitFlagInput } from './submissions.schema.js';

export interface SubmitResult {
  correct: boolean;
  duplicate?: boolean;
  points?: number;
  firstBlood?: boolean;
  flagLabel?: string | null;
  message: string;
}

function flagAlgorithm(value: string): FlagHashAlgorithm {
  return value === 'sha512' ? 'sha512' : 'sha256';
}

export async function submitFlag(user: User, input: SubmitFlagInput): Promise<SubmitResult> {
  if (env.REQUIRE_EMAIL_VERIFICATION && !user.emailVerifiedAt) {
    throw new HttpError(403, 'Verify your email address before submitting flags');
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: input.challengeId },
    include: { flags: true, event: true },
  });
  if (!challenge || !challenge.published) throw new HttpError(404, 'Challenge not found');

  if (challenge.event?.endsAt && challenge.event.endsAt.getTime() < Date.now()) {
    throw new HttpError(403, 'This competition has ended');
  }

  const provided = normalizeFlag(input.flag);
  const matched = challenge.flags.find((flag) =>
    verifyFlag(provided, flag.salt, flag.hash, flagAlgorithm(flag.algo)),
  );

  if (!matched) {
    // Wrong guesses are salted and hashed too: the plaintext attempt never
    // lands in the database, only its length (and, optionally, a hash prefix
    // admins can use to spot repeated guesses).
    const salt = newSalt();
    await prisma.submission.create({
      data: {
        userId: user.id,
        teamId: user.teamId,
        challengeId: challenge.id,
        correct: false,
        providedSalt: salt,
        providedHash: hashAttempt(provided, salt),
        providedLength: provided.length,
      },
    });
    return { correct: false, message: 'Incorrect flag.' };
  }

  const existing = await prisma.solve.findFirst({
    where: {
      flagId: matched.id,
      OR: user.teamId ? [{ userId: user.id }, { teamId: user.teamId }] : [{ userId: user.id }],
    },
  });
  if (existing) {
    await prisma.submission.create({
      data: {
        userId: user.id,
        teamId: user.teamId,
        challengeId: challenge.id,
        flagId: matched.id,
        correct: true,
      },
    });
    return { correct: true, duplicate: true, message: 'You already solved this flag.' };
  }

  const solvesBefore = await prisma.solve.count({ where: { flagId: matched.id } });
  const firstBlood = solvesBefore === 0;
  // Dynamic events freeze the decayed award on the solve, so a later scoring
  // change never rewrites history.
  const points = awardFor(scoringConfigFor(challenge.event), matched.points, solvesBefore);

  try {
    await prisma.$transaction([
      prisma.solve.create({
        data: {
          userId: user.id,
          teamId: user.teamId,
          challengeId: challenge.id,
          flagId: matched.id,
          points,
          firstBlood,
        },
      }),
      // Correct attempts reference the flag id only; the flag value itself is
      // never written to the database in plaintext.
      prisma.submission.create({
        data: {
          userId: user.id,
          teamId: user.teamId,
          challengeId: challenge.id,
          flagId: matched.id,
          correct: true,
        },
      }),
    ]);
  } catch (error) {
    // A teammate solved the same flag between our read and write.
    if ((error as { code?: string }).code === 'P2002') {
      return { correct: true, duplicate: true, message: 'You already solved this flag.' };
    }
    throw error;
  }

  return {
    correct: true,
    points,
    firstBlood,
    flagLabel: matched.label,
    message: firstBlood ? 'First blood! Flag accepted.' : 'Flag accepted.',
  };
}

export async function mySubmissions(user: User) {
  const submissions = await prisma.submission.findMany({
    where: { userId: user.id },
    include: {
      challenge: { select: { id: true, title: true } },
      flag: { select: { id: true, label: true, points: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return submissions.map((s) => ({
    id: s.id,
    correct: s.correct,
    providedLength: s.providedLength,
    providedHashPrefix:
      env.WRONG_ATTEMPT_DISPLAY_PREFIX && s.providedHash ? s.providedHash.slice(0, 8) : null,
    createdAt: s.createdAt.toISOString(),
    challenge: s.challenge,
    flag: s.flag ? { id: s.flag.id, label: s.flag.label, points: s.flag.points } : null,
  }));
}
