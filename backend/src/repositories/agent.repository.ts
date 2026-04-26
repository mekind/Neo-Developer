import { Injectable } from '@nestjs/common';
import { Agent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AgentCreateInput {
  userId: string;
  name: string;
  status?: string;
}

export interface IAgentRepository {
  create(input: AgentCreateInput): Promise<Agent>;
  findById(id: string): Promise<Agent | null>;
  listByUser(userId: string): Promise<Agent[]>;
  listAll(): Promise<Agent[]>;
  countByUser(userId: string): Promise<number>;
  update(id: string, patch: Partial<AgentCreateInput>): Promise<Agent>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class AgentRepository implements IAgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: AgentCreateInput) {
    return this.prisma.agent.create({ data: input });
  }

  findById(id: string) {
    return this.prisma.agent.findUnique({ where: { id } });
  }

  listByUser(userId: string) {
    return this.prisma.agent.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  listAll() {
    return this.prisma.agent.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  countByUser(userId: string) {
    return this.prisma.agent.count({ where: { userId } });
  }

  update(id: string, patch: Partial<AgentCreateInput>) {
    return this.prisma.agent.update({ where: { id }, data: patch });
  }

  async delete(id: string) {
    await this.prisma.agent.delete({ where: { id } });
  }
}
