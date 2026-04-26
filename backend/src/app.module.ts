import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ItemsModule } from './items/items.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { SkillsModule } from './skills/skills.module';

@Module({
  imports: [
    PrismaModule,
    RepositoriesModule,
    HealthModule,
    ItemsModule,
    SkillsModule,
  ],
})
export class AppModule {}
