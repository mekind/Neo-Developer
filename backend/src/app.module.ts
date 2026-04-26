import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { GreetingsModule } from './greetings/greetings.module';
import { HealthModule } from './health/health.module';
import { ItemsModule } from './items/items.module';
import { MemoryModule } from './memory/memory.module';
import { OpenclawModule } from './openclaw/openclaw.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    RepositoriesModule,
    OpenclawModule,
    HealthModule,
    ItemsModule,
    UsersModule,
    MemoryModule,
    AgentsModule,
    SkillsModule,
    GreetingsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
