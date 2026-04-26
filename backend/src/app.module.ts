import { Module } from '@nestjs/common';
import { ItemsModule } from './items/items.module';
import { MemoryModule } from './memory/memory.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [ItemsModule, MemoryModule, AgentsModule],
})
export class AppModule {}
