import { z } from 'zod';

export interface SkillContext {
  userId: string;
  signal?: AbortSignal;
}

export interface Skill<T extends z.ZodTypeAny = any, R = any> {
  name: string;
  description: string;
  schema: T;
  execute: (args: z.infer<T>, context: SkillContext) => Promise<R>;
}
