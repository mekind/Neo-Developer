import { Injectable } from '@nestjs/common';
import { getClarifyingQuestions } from 'openclaw';
import { MemoryDocumentRepository } from '../repositories/memory-document.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AgentsService {
  constructor(private readonly docs: MemoryDocumentRepository) {}

  async clarify(prompt: string, context?: string) {
    return await getClarifyingQuestions(prompt, context);
  }

  async createAgent(userId: string, data: any) {
    const agentId = uuidv4();
    const agentDir = `agents/\${agentId}`;

    // Create persona.md
    await this.docs.upsert(userId, `\${agentDir}/persona`, {
      body: data.persona?.body || 'A helpful agent.',
      frontmatter: data.persona?.frontmatter || {},
    });

    // Create SOUL.md
    await this.docs.upsert(userId, `\${agentDir}/SOUL`, {
      body: data.soul?.body || 'You are an AI assistant.',
      frontmatter: data.soul?.frontmatter || { greetings_approach: ['Hello!'] },
    });

    // Create config.md
    await this.docs.upsert(userId, `\${agentDir}/config`, {
      body: '',
      frontmatter: data.config || { formality: 'polite' },
    });

    return {
      id: agentId,
      name: data.name,
      createdAt: new Date().toISOString(),
    };
  }
}
