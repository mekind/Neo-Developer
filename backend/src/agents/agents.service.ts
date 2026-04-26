import { Injectable, NotFoundException } from '@nestjs/common';
import { getClarifyingQuestions, invokeAgent } from 'openclaw';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async clarify(prompt: string, context?: string) {
    return await getClarifyingQuestions(prompt, context);
  }

  async createAgent(userId: string, data: any) {
    const agent = await this.prisma.agent.create({
      data: {
        userId,
        name: data.name || 'Unnamed Agent',
        persona: JSON.stringify(data.persona || { body: 'A helpful agent.' }),
        soul: JSON.stringify(data.soul || { body: 'You are an AI assistant.' }),
        config: JSON.stringify(data.config || { formality: 'polite' }),
      },
    });

    return {
      id: agent.id,
      name: agent.name,
      createdAt: agent.createdAt,
    };
  }

  async invokeAgent(userId: string, agentId: string, message: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent \${agentId} not found`);
    }

    const persona = JSON.parse(agent.persona);
    const soul = JSON.parse(agent.soul);
    const config = JSON.parse(agent.config);

    return await invokeAgent(agent.id, message, persona, soul, config);
  }
}
