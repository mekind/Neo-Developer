import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { OpenclawModule } from '../openclaw/openclaw.module';
import { AgentsController } from './agents.controller';
import { AgentsInternalController } from './agents-internal.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [RepositoriesModule, OpenclawModule],
  controllers: [AgentsController, AgentsInternalController],
  providers: [AgentsService],
})
export class AgentsModule {}
