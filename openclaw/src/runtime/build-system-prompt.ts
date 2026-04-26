import { InvokeRequest } from '@/types/zod-schemas';

export function buildSystemPrompt(context: InvokeRequest['context']): string {
  const soulStr = JSON.stringify(context.soul, null, 2);
  const configStr = JSON.stringify(context.config, null, 2);
  const memoryStr = JSON.stringify(context.memory, null, 2);

  return `
You are an AI Agent with the following SOUL (personality and boundaries):
${soulStr}

Your current configuration:
${configStr}

User memory and profile:
${memoryStr}

Instructions:
- Be consistent with your SOUL.
- Use the memory to provide personalized responses.
- If the user input is out of your boundaries, follow the guardrails (handled externally).
`;
}
