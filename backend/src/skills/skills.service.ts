import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SkillRepository } from '../repositories/skill.repository';
import { SKILL_CATALOG } from './skill-catalog';

@Injectable()
export class SkillsService implements OnModuleInit {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillRepository,
  ) {}

  async onModuleInit() {
    try {
      for (const seed of SKILL_CATALOG) {
        await this.prisma.skill.upsert({
          where: { id: seed.id },
          create: {
            id: seed.id,
            name: seed.name,
            description: seed.description,
            triggers: seed.triggers,
            defaultParams: (seed.defaultParams ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            enabled: true,
          },
          update: {
            name: seed.name,
            description: seed.description,
            triggers: seed.triggers,
            defaultParams: (seed.defaultParams ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          },
        });
      }
      this.logger.log(`Skill catalog seeded (${SKILL_CATALOG.length} entries)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Skill catalog seed skipped (DB unreachable?): ${message}`,
      );
    }
  }

  listEnabled() {
    return this.skills.listEnabled();
  }
}
