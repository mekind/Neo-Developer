import { Module } from '@nestjs/common';
import { ItemsModule } from './items/items.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [ItemsModule, AgentsModule],
})
export class AppModule {}
