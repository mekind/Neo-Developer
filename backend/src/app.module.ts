import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { ItemsModule } from './items/items.module';
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [AgentsModule, ItemsModule, MemoryModule],
})
export class AppModule {}
