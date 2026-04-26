import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
