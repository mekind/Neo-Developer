import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { ItemsModule } from './items/items.module';
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [ItemsModule, MemoryModule, AgentsModule],
})
export class AppModule {}
