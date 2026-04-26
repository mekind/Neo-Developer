import { generateText } from 'ai';
import { geminiModel } from '../clients/ai';
import { buildSystemPrompt } from './build-system-prompt';
import { InvokeRequest, InvokeResponse } from '../types/zod-schemas';
import { selectSkills } from './select-skills';
import { SkillContext } from '../skills/types';

export async function runInvoke(request: InvokeRequest): Promise<InvokeResponse> {
  const systemPrompt = buildSystemPrompt(request.context);
  
  const skillContext: SkillContext = {
    userId: request.user_id,
  };
  
  const enabledSkills = request.context.config?.skills as string[] | undefined;
  const tools = selectSkills(enabledSkills, skillContext);
  
  const hasTools = Object.keys(tools).length > 0;

  const { text, usage, toolCalls } = await generateText({
    model: geminiModel,
    system: systemPrompt,
    prompt: `User (${request.user_id}) says: ${request.input}${request.trigger ? `\nTrigger: ${request.trigger}` : ''}`,
    ...(hasTools ? {
      tools,
      toolChoice: 'auto',
      maxToolRoundtrips: 4,
    } : {})
  });

  const used_skills = toolCalls ? toolCalls.map(tc => tc.toolName) : [];

  return {
    reply: text || null,
    used_skills,
    tokens: usage ? { input: (usage as any).promptTokens, output: (usage as any).completionTokens } : undefined,
    refused: null,
  };
}
