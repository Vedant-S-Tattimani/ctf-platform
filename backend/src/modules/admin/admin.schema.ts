import { z } from 'zod';

const difficulty = z.enum(['easy', 'medium', 'hard', 'insane']);

export const flagInputSchema = z.object({
  label: z.string().max(80).optional(),
  value: z.string().min(4).max(200),
  points: z.number().int().positive().max(10_000),
  /** Defaults to FLAG_HASH_ALGORITHM when omitted. */
  algo: z.enum(['sha256', 'sha512']).optional(),
});

export const createChallengeSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  eventId: z.string().nullish(),
  difficulty: difficulty.default('medium'),
  points: z.number().int().positive().max(10_000),
  published: z.boolean().default(false),
  order: z.number().int().default(0),
  flags: z.array(flagInputSchema).min(1),
  hints: z.array(z.object({ content: z.string().min(1), cost: z.number().int().min(0).default(0) })).default([]),
  files: z
    .array(z.object({ name: z.string().min(1), path: z.string().min(1), sizeBytes: z.number().int().nullish() }))
    .default([]),
});

export const updateChallengeSchema = createChallengeSchema
  .omit({ flags: true, hints: true, files: true })
  .partial();

export const addHintSchema = z.object({
  content: z.string().min(1),
  cost: z.number().int().min(0).default(0),
});

export const addFileSchema = z
  .object({
    /** Attach a stored upload (from POST /admin/files). */
    assetId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    path: z.string().min(1).optional(),
    sizeBytes: z.number().int().nullish(),
  })
  .refine((value) => Boolean(value.assetId) || Boolean(value.name && value.path), {
    message: 'Provide an assetId or both a name and a path',
    path: ['path'],
  });

export const createCategorySchema = z.object({
  name: z.string().min(2).max(40),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  color: z.string().max(20).nullish(),
  icon: z.string().max(40).nullish(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createEventSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().nullish(),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
  teamMaxSize: z.number().int().min(1).max(50).default(5),
  published: z.boolean().default(false),
  scoringMode: z.enum(['STATIC', 'DYNAMIC']).default('STATIC'),
  scoringMinimumPoints: z.number().int().min(0).max(10_000).default(100),
  scoringDecayThreshold: z.number().int().min(2).max(10_000).default(40),
});

export const updateEventSchema = createEventSchema.partial();

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamsSchema = z.object({ id: z.string().min(1) });

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
export type FlagInput = z.infer<typeof flagInputSchema>;
export type AddHintInput = z.infer<typeof addHintSchema>;
export type AddFileInput = z.infer<typeof addFileSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
