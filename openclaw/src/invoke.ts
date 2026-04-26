import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function invokeAgent(
  agentId: string,
  message: string,
  persona: any,
  soul: any,
  config: any
) {
  // Extract configuration from the stored definitions
  const personaBody = persona.body || 'You are a helpful assistant.';
  const soulBody = soul.body || '';
  const formality = config.frontmatter?.formality || config.formality || 'polite';
  const greetings = soul.frontmatter?.greetings_approach || ['Hello!'];

  // Construct the system prompt using the components
  const systemPrompt = `
You are an AI agent.
Persona: \${personaBody}
Soul/Behavior Rules: \${soulBody}
Formality Level: \${formality}

Ensure your responses align strictly with the Persona and Soul definitions.
Always maintain the required formality level.
`;

  // Generate the response using Gemini model via AI SDK
  const { text } = await generateText({
    model: google('gemini-3-flash-preview'),
    system: systemPrompt,
    prompt: message,
  });

  return {
    response: text,
    agentId,
    timestamp: new Date().toISOString()
  };
}
