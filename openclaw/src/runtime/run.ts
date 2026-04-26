import { generateText } from 'ai';
import { geminiModel } from '../clients/ai';
import { buildSystemPrompt } from './build-system-prompt';
import { InvokeRequest, InvokeResponse } from '../types/zod-schemas';

export async function runInvoke(request: InvokeRequest): Promise<InvokeResponse> {
  const systemPrompt = buildSystemPrompt(request.context);
  
  const { text, usage } = await generateText({
    model: geminiModel,
    system: systemPrompt,
    prompt: `User (${request.user_id}) says: ${request.input}${request.trigger ? `\nTrigger: ${request.trigger}` : ''}`,
  });

  return {
    reply: text || null,
    used_skills: [],
    tokens: usage ? { input: (usage as any).promptTokens, output: (usage as any).completionTokens } : undefined,
    refused: null,
  };
}
