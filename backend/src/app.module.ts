import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { HealthModule } from './health/health.module';
import { ItemsModule } from './items/items.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [
    PrismaModule,
    RepositoriesModule,
    HealthModule,
    ItemsModule,
    AgentsModule,
  ],
})
export class AppModule {}
