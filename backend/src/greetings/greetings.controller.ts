import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { GreetingsService, GreetingType } from './greetings.service';

@Controller('users/:userId/agents/:agentId/greeting')
export class GreetingsController {
  constructor(private readonly greetings: GreetingsService) {}

  @Get()
  pick(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
    @Query('type') type: string,
  ) {
    if (type !== 'alert' && type !== 'approach') {
      throw new BadRequestException("query 'type' must be 'alert' or 'approach'");
    }
    return this.greetings.pickGreeting(userId, agentId, type as GreetingType);
  }
}
