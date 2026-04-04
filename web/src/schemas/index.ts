import { z } from 'zod';

export const testSchema = z.object({
  testId: z.string(),
  lang: z.string(),
  fullName: z.string().min(1).max(500),
  invalid: z.boolean(),
  answers: z
    .array(
      z.object({
        id: z.string(),
        answer: z.string(),
        domain: z.string(),
        facet: z.number(),
        score: z.number()
      })
    )
    .nonempty(),
  timeElapsed: z.number(),
  dateStamp: z.date()
});

const objectId = /^[0-9a-fA-F]{24}$/;
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const testId = z.object({
  id: z
    .string()
    .refine((s) => objectId.test(s) || uuid.test(s), 'Invalid result ID')
});
