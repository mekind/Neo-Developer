import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AgentRepository } from '../repositories/agent.repository';
import { MemoryDocumentRepository } from '../repositories/memory-document.repository';
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { OpenclawClient } from '../openclaw/openclaw.client';
import { MemorySnapshot } from '../openclaw/openclaw.types';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { InvokeAgentDto } from './dto/invoke-agent.dto';

const MAX_AGENTS = 3;

type DocKey = 'persona' | 'soul' | 'config';

@Injectable()
export class AgentsService {
  constructor(
    private readonly agents: AgentRepository,
    private readonly docs: MemoryDocumentRepository,
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly openclaw: OpenclawClient,
  ) {}

  private paths(agentId: string) {
    return {
      persona: `agents/${agentId}/persona`,
      soul: `agents/${agentId}/SOUL`,
      config: `agents/${agentId}/config`,
    } as const;
  }

  private async ensureUser(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
  }

  private async ensureAgent(userId: string, agentId: string) {
    const agent = await this.agents.findById(agentId);
    if (!agent || agent.userId !== userId) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }
    return agent;
  }

  private async loadDoc(userId: string, path: string) {
    const doc = await this.docs.findOne(userId, path);
    return doc?.frontmatter ?? null;
  }

  private async writeDoc(
    userId: string,
    path: string,
    data: Record<string, unknown>,
  ) {
    return this.docs.upsert(userId, path, {
      body: JSON.stringify(data, null, 2),
      frontmatter: data as Prisma.InputJsonValue,
    });
  }

  async list(userId: string) {
    await this.ensureUser(userId);
    const agents = await this.agents.listByUser(userId);
    return Promise.all(
      agents.map(async (a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        createdAt: a.createdAt,
        persona: await this.loadDoc(userId, this.paths(a.id).persona),
      })),
    );
  }

  async create(userId: string, dto: CreateAgentDto) {
    await this.ensureUser(userId);
    const count = await this.agents.countByUser(userId);
    if (count >= MAX_AGENTS) {
      throw new ConflictException(
        `에이전트는 최대 ${MAX_AGENTS}개까지 만들 수 있어요`,
      );
    }
    const agent = await this.agents.create({ userId, name: dto.name });
    const p = this.paths(agent.id);
    await Promise.all([
      this.writeDoc(userId, p.persona, dto.persona),
      this.writeDoc(userId, p.soul, dto.soul),
      this.writeDoc(userId, p.config, dto.config),
    ]);
    return this.findOne(userId, agent.id);
  }

  async findOne(userId: string, agentId: string) {
    await this.ensureUser(userId);
    const agent = await this.ensureAgent(userId, agentId);
    const p = this.paths(agentId);
    const [persona, soul, config] = await Promise.all([
      this.loadDoc(userId, p.persona),
      this.loadDoc(userId, p.soul),
      this.loadDoc(userId, p.config),
    ]);
    return {
      id: agent.id,
      name: agent.name,
      status: agent.status,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      persona,
      soul,
      config,
    };
  }

  async update(userId: string, agentId: string, dto: UpdateAgentDto) {
    await this.ensureUser(userId);
    await this.ensureAgent(userId, agentId);
    const patch: { name?: string; status?: string } = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.status !== undefined) patch.status = dto.status;
    if (patch.name !== undefined || patch.status !== undefined) {
      await this.agents.update(agentId, patch);
    }
    const p = this.paths(agentId);
    const writes: Promise<unknown>[] = [];
    const docMap: Array<[DocKey, string]> = [
      ['persona', p.persona],
      ['soul', p.soul],
      ['config', p.config],
    ];
    for (const [key, path] of docMap) {
      const value = dto[key];
      if (value !== undefined) writes.push(this.writeDoc(userId, path, value));
    }
    await Promise.all(writes);
    return this.findOne(userId, agentId);
  }

  async remove(userId: string, agentId: string) {
    await this.ensureUser(userId);
    await this.ensureAgent(userId, agentId);
    const p = this.paths(agentId);
    await this.agents.delete(agentId);
    await Promise.allSettled([
      this.docs.delete(userId, p.persona),
      this.docs.delete(userId, p.soul),
      this.docs.delete(userId, p.config),
    ]);
    return { id: agentId, deleted: true as const };
  }

  async invoke(userId: string, agentId: string, dto: InvokeAgentDto) {
    await this.ensureUser(userId);
    await this.ensureAgent(userId, agentId);

    const p = this.paths(agentId);
    const [soul, config] = await Promise.all([
      this.loadDoc(userId, p.soul),
      this.loadDoc(userId, p.config),
    ]);

    const profile = await this.profiles.findByUserId(userId);
    const [prefDoc, interestDoc] = await Promise.all([
      this.loadDoc(userId, 'profile/preferences'),
      this.loadDoc(userId, 'profile/interests'),
    ]);

    let interests: string[] | undefined;
    if (Array.isArray(interestDoc)) {
      interests = interestDoc as string[];
    } else if (interestDoc && typeof interestDoc === 'object') {
      interests = (interestDoc as any).items ?? (interestDoc as any).interests;
    }

    const logDoc = await this.docs.findOne(userId, 'log');
    const recent_history = this.parseRecentLogs(logDoc?.body);

    const snapshot: MemorySnapshot = {
      profile: profile ? { nickname: profile.nickname, purpose: profile.purpose, techLevel: profile.techLevel } : null,
      preferences: prefDoc as Record<string, unknown> | null,
      interests,
      recent_history,
    };

    return this.openclaw.invoke({
      user_id: userId,
      agent_id: agentId,
      input: dto.message,
      trigger: 'message',
      context: {
        soul: (soul as Record<string, unknown>) || {},
        config: (config as Record<string, unknown>) || {},
        memory_snapshot: snapshot,
      },
    });
  }

  private parseRecentLogs(body?: string): Array<{ ts: string; event: string; meta?: unknown }> {
    if (!body) return [];
    const lines = body.split('\n');
    const history: Array<{ ts: string; event: string }> = [];
    for (const line of lines) {
      const match = line.match(/^- (.*?): (.*)$/);
      if (match) {
        history.push({ ts: match[1], event: match[2] });
        if (history.length >= 10) break;
      }
    }
    return history;
  }
}
