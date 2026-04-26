import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AppendLogDto } from './dto/append-log.dto';
import { ServiceTokenGuard } from './guards/service-token.guard';

@ApiTags('internal')
@Controller('users/:userId/log')
export class UsersInternalController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @UseGuards(ServiceTokenGuard)
  @ApiBearerAuth('BACKEND_SERVICE_TOKEN')
  @ApiOperation({
    summary: '사용자 로그 추가 (시스템용)',
    description: '에이전트 응답 등 이벤트 기록. 서비스 토큰 인증 필요.',
  })
  @ApiParam({ name: 'userId', description: '사용자 uuid' })
  appendLog(
    @Param('userId') userId: string,
    @Body() dto: AppendLogDto,
  ) {
    return this.users.appendLog(userId, dto);
  }
}
