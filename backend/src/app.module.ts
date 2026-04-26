import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ItemsModule } from './items/items.module';
import { MemoryModule } from './memory/memory.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [
    PrismaModule,
    RepositoriesModule,
    HealthModule,
    ItemsModule,
    MemoryModule,
  ],
})
export class AppModule {}
