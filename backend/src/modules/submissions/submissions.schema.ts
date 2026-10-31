import { z } from 'zod';

export const submitFlagSchema = z.object({
  challengeId: z.string().min(1),
  flag: z.string().min(1).max(200),
});

export type SubmitFlagInput = z.infer<typeof submitFlagSchema>;
