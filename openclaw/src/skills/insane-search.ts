import { z } from 'zod';
import { Skill } from './types';

export const insaneSearchSkill: Skill = {
  name: 'insane-search',
  description: 'Search the web for real-time information, news, or specific topics.',
  schema: z.object({
    query: z.string().describe('The search query'),
    sources: z.array(z.string()).optional().describe('Specific sources to search (e.g., twitter, news)'),
    since: z.string().optional().describe('Date string to search since'),
    limit: z.number().optional().describe('Maximum number of results to return'),
  }),
  execute: async (args, context) => {
    // Check for abort signal
    context.signal?.throwIfAborted();

    // Mock response for now
    console.log(`[insane-search] Query: ${args.query}, Sources: ${args.sources}, Since: ${args.since}, Limit: ${args.limit}`);
    
    return {
      results: [
        {
          title: `Mock Result for "${args.query}"`,
          url: 'https://example.com/mock',
          snippet: 'This is a mock search result for the given query.',
        }
      ],
      mock: true
    };
  }
};
