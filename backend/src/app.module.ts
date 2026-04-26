import { Module } from '@nestjs/common';
import { ItemsModule } from './items/items.module';
import { AgentsModule } from './agents/agents.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ItemsModule, AgentsModule],
})
export class AppModule {}
