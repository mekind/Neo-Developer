import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ItemsModule } from './items/items.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [PrismaModule, RepositoriesModule, HealthModule, ItemsModule],
})
export class AppModule {}
