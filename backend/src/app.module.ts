import { Module } from '@nestjs/common';
import { ItemsModule } from './items/items.module';
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [ItemsModule, MemoryModule],
})
export class AppModule {}
