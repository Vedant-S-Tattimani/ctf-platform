import { z } from 'zod';

export const scoreboardQuerySchema = z.object({
  scope: z.enum(['teams', 'users']).default('teams'),
  eventId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ScoreboardQuery = z.infer<typeof scoreboardQuerySchema>;
