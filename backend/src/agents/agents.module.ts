import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { MemoryDocumentRepository } from '../repositories/memory-document.repository';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, MemoryDocumentRepository],
  exports: [AgentsService],
})
export class AgentsModule {}
