import { z } from 'zod';

export const updateMeSchema = z.object({
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
