import { Injectable } from '@nestjs/common';
import { Skill } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ISkillRepository {
  listEnabled(): Promise<Skill[]>;
  findById(id: string): Promise<Skill | null>;
}

@Injectable()
export class SkillRepository implements ISkillRepository {
  constructor(private readonly prisma: PrismaService) {}

  listEnabled() {
    return this.prisma.skill.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.skill.findUnique({ where: { id } });
  }
}
