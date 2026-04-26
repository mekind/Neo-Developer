import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('users/:userId/agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  list(@Param('userId') userId: string) {
    return this.agents.list(userId);
  }

  @Post()
  create(@Param('userId') userId: string, @Body() dto: CreateAgentDto) {
    return this.agents.create(userId, dto);
  }

  @Get(':agentId')
  findOne(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.agents.findOne(userId, agentId);
  }

  @Patch(':agentId')
  update(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agents.update(userId, agentId, dto);
  }

  @Delete(':agentId')
  remove(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.agents.remove(userId, agentId);
  }
}
