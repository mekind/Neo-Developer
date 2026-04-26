import { Controller, Post, Body, Param } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('users/:userId/agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('clarify')
  async clarify(
    @Param('userId') userId: string,
    @Body() body: { prompt: string; context?: string },
  ) {
    return await this.agentsService.clarify(body.prompt, body.context);
  }

  @Post()
  async create(
    @Param('userId') userId: string,
    @Body() body: any,
  ) {
    return await this.agentsService.createAgent(userId, body);
  }

  @Post(':agentId/invoke')
  async invoke(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
    @Body() body: { message: string },
  ) {
    return await this.agentsService.invokeAgent(userId, agentId, body.message);
  }
}
