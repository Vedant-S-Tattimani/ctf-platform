import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(3).max(40),
  description: z.string().max(300).optional(),
});

export const joinTeamSchema = z.object({
  inviteCode: z.string().min(4).max(16),
});

export const updateTeamSchema = z.object({
  name: z.string().min(3).max(40).optional(),
  description: z.string().max(300).nullable().optional(),
});

export const teamIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const memberParamsSchema = z.object({
  userId: z.string().min(1),
});

export const transferOwnershipSchema = z.object({
  userId: z.string().min(1),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
