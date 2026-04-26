import { z } from 'zod';

export const MemorySnapshotSchema = z.object({
  profile: z.record(z.string(), z.unknown()).nullable().optional(),
  preferences: z.record(z.string(), z.unknown()).nullable().optional(),
  interests: z.array(z.string()).optional(),
  recent_history: z.array(z.unknown()).optional(),
});

export const InvokeRequestSchema = z.object({
  agent_id: z.string(),
  user_id: z.string(),
  input: z.string(),
  trigger: z.string().optional(),
  context: z.object({
    soul: z.record(z.string(), z.unknown()),
    config: z.record(z.string(), z.unknown()),
    memory: MemorySnapshotSchema,
  }),
});

export type InvokeRequest = z.infer<typeof InvokeRequestSchema>;

export const InvokeResponseSchema = z.object({
  reply: z.string().nullable(),
  used_skills: z.array(z.string()),
  tokens: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
  refused: z.object({
    reason: z.string(),
    phrase: z.string(),
  }).nullable(),
});

export type InvokeResponse = z.infer<typeof InvokeResponseSchema>;
