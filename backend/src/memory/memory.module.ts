import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [MemoryController],
  providers: [MemoryService],
})
export class MemoryModule {}
