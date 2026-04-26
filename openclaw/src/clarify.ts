import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const clarifySchema = z.object({
  lens: z.enum(['vague', 'unknown', 'metamedium']),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(4),
    rationale: z.string(),
  })),
  context: z.string(),
});

export type ClarifyResult = z.infer<typeof clarifySchema>;

export async function getClarifyingQuestions(prompt: string, currentContext: string = ''): Promise<ClarifyResult> {
  const { object } = await generateObject({
    model: google('gemini-1.5-flash'),
    schema: clarifySchema,
    system: `You are the "Clarify" agent based on the 3-lens requirement clarification pattern.
Your goal is to turn vague agent ideas into precise specifications.

Lenses:
1. Vague: Clear up blurry requirements. (Focus on "What" and "Who")
2. Unknown: Check for assumptions and blind spots. (Focus on "How" and "Constraints")
3. Metamedium: Switch between content and format. (Focus on "Output" and "Style")

Pattern:
- Use "Hypothesis-as-Options": Always provide 2-4 specific options for each question instead of open-ended questions.
- Focus on one lens at a time. Start with "vague".
- Provide 3-5 high-impact questions.

Current User Idea: \${prompt}
Existing Context: \${currentContext}`,
    prompt: `Analyze the user idea and provide clarifying questions using the appropriate lens.`,
  });

  return object;
}
