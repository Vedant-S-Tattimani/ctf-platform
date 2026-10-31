import { z } from 'zod';

export const listChallengesQuerySchema = z.object({
  category: z.string().optional(),
  eventId: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'insane']).optional(),
});

export const challengeIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const unlockHintParamsSchema = z.object({
  id: z.string().min(1),
  hintId: z.string().min(1),
});

export type ListChallengesQuery = z.infer<typeof listChallengesQuerySchema>;
