import {
  Controller,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AgentsService } from './agents.service';

@ApiTags('internal')
@Controller('agents')
export class AgentsInternalController {
  constructor(private readonly agents: AgentsService) {}

  @Get('due')
  @ApiOperation({
    summary: '실행 대기 중인 에이전트 목록 조회 (Internal)',
    description: 'Cron 작업용. 서비스 토큰 인증 필요.',
  })
  @ApiQuery({ name: 'at', required: false, description: '기준 시각 (ISO)' })
  async getDueAgents(
    @Query('at') at: string,
    @Headers('authorization') auth: string,
  ) {
    const token = process.env.BACKEND_SERVICE_TOKEN;
    if (!token || auth !== `Bearer ${token}`) {
      throw new UnauthorizedException('Invalid service token');
    }
    return this.agents.getDueAgents(at);
  }
}
