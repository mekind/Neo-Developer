import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentRepository } from '../repositories/agent.repository';
import { MemoryDocumentRepository } from '../repositories/memory-document.repository';
import { UserRepository } from '../repositories/user.repository';

export type GreetingType = 'alert' | 'approach';

@Injectable()
export class GreetingsService {
  constructor(
    private readonly users: UserRepository,
    private readonly agents: AgentRepository,
    private readonly docs: MemoryDocumentRepository,
  ) {}

  async pickGreeting(userId: string, agentId: string, type: GreetingType) {
    if (type !== 'alert' && type !== 'approach') {
      throw new BadRequestException("type must be 'alert' or 'approach'");
    }

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const agent = await this.agents.findById(agentId);
    if (!agent || agent.userId !== userId) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    const soul = await this.docs.findOne(userId, `agents/${agentId}/SOUL`);
    if (!soul) throw new NotFoundException('SOUL document not found');

    const fm = (soul.frontmatter ?? {}) as Record<string, unknown>;
    const key = type === 'alert' ? 'greetings_alert' : 'greetings_approach';
    const list = fm[key];

    if (!Array.isArray(list) || list.length === 0) {
      return { text: null, type, agentId };
    }

    const strings = list.filter((v): v is string => typeof v === 'string');
    if (strings.length === 0) return { text: null, type, agentId };

    const idx = Math.floor(Math.random() * strings.length);
    return { text: strings[idx], type, agentId };
  }
}
