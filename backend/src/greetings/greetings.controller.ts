import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GreetingsService, GreetingType } from './greetings.service';

@ApiTags('greetings')
@Controller('users/:userId/agents/:agentId/greeting')
@ApiParam({ name: 'userId', description: '사용자 uuid' })
@ApiParam({ name: 'agentId', description: '에이전트 uuid' })
export class GreetingsController {
  constructor(private readonly greetings: GreetingsService) {}

  @Get()
  @ApiOperation({
    summary: '에이전트 인사말 랜덤 픽 (LLM 호출 없음 — plan FR-03-2)',
    description:
      '`SOUL` 문서 frontmatter 의 `greetings_alert` / `greetings_approach` 배열에서 정적 랜덤 픽. 빈 배열이면 `text=null`.',
  })
  @ApiQuery({
    name: 'type',
    enum: ['alert', 'approach'],
    description: 'alert = 알림 시, approach = 사용자가 다가올 때',
  })
  pick(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
    @Query('type') type: string,
  ) {
    if (type !== 'alert' && type !== 'approach') {
      throw new BadRequestException(
        "query 'type' must be 'alert' or 'approach'",
      );
    }
    return this.greetings.pickGreeting(userId, agentId, type as GreetingType);
  }
}
