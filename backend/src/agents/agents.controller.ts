import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { InvokeAgentDto } from './dto/invoke-agent.dto';

@ApiTags('agents')
@Controller('users/:userId/agents')
@ApiParam({ name: 'userId', description: '사용자 uuid' })
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  @ApiOperation({
    summary: '사용자의 에이전트 목록',
    description: '각 항목에 persona frontmatter 가 함께 포함됩니다.',
  })
  list(@Param('userId') userId: string) {
    return this.agents.list(userId);
  }

  @Post()
  @ApiOperation({
    summary: '에이전트 생성 (사용자당 ≤3)',
    description:
      '`persona`/`soul`/`config` 가 각각 `MemoryDocument` 의 `agents/{id}/{persona|SOUL|config}` 경로에 저장됩니다.',
  })
  @ApiConflictResponse({
    description: '이미 3개 보유 — 4번째 생성 차단 (plan VC-10)',
    schema: {
      example: {
        message: '에이전트는 최대 3개까지 만들 수 있어요',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  create(@Param('userId') userId: string, @Body() dto: CreateAgentDto) {
    return this.agents.create(userId, dto);
  }

  @Get(':agentId')
  @ApiOperation({ summary: '에이전트 단건 조회 (persona/soul/config 포함)' })
  @ApiParam({ name: 'agentId', description: '에이전트 uuid' })
  findOne(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.agents.findOne(userId, agentId);
  }

  @Patch(':agentId')
  @ApiOperation({
    summary: '에이전트 부분 수정',
    description: '`name`/`status` 외에 `persona`/`soul`/`config` 중 일부만 보내면 그 문서만 갱신됩니다.',
  })
  @ApiParam({ name: 'agentId', description: '에이전트 uuid' })
  update(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agents.update(userId, agentId, dto);
  }

  @Delete(':agentId')
  @ApiOperation({ summary: '에이전트 삭제 (persona/SOUL/config 문서도 함께 정리)' })
  @ApiParam({ name: 'agentId', description: '에이전트 uuid' })
  remove(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.agents.remove(userId, agentId);
  }

  @Post(':agentId/invoke')
  @ApiOperation({ summary: '에이전트와 대화하기 (invoke)' })
  @ApiParam({ name: 'userId', description: '사용자 uuid' })
  @ApiParam({ name: 'agentId', description: '에이전트 uuid' })
  invoke(
    @Param('userId') userId: string,
    @Param('agentId') agentId: string,
    @Body() dto: InvokeAgentDto,
  ) {
    return this.agents.invoke(userId, agentId, dto);
  }
}
