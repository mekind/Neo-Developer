import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { HealthModule } from './health/health.module';
import { ItemsModule } from './items/items.module';
import { MemoryModule } from './memory/memory.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    RepositoriesModule,
    HealthModule,
    ItemsModule,
    UsersModule,
    MemoryModule,
    AgentsModule,
    SkillsModule,
  ],
})
export class AppModule {}
