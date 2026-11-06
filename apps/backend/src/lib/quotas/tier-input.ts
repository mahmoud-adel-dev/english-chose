import { z } from "zod";

const quotaTierInputSchema = z.object({
  name: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  maxDailyQuestions: z.number().int().nonnegative(),
  maxDailySessions: z.number().int().nonnegative(),
  maxAudioMinutesDay: z.number().finite().nonnegative(),
  maxAttemptsPerItem: z.number().int().min(1),
  requestsPerMinute: z.number().int().min(1),
  isActive: z.boolean(),
});

export type QuotaTierInput = z.infer<typeof quotaTierInputSchema>;

export function parseQuotaTierInput(input: unknown): QuotaTierInput {
  return quotaTierInputSchema.parse(input);
}
