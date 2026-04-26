import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AppendLogDto } from './dto/append-log.dto';
import { PutMemoryDocumentDto } from './dto/put-memory-document.dto';
import { MemoryService } from './memory.service';

@ApiTags('memory')
@Controller('users/:userId')
@ApiParam({ name: 'userId', description: '사용자 uuid' })
export class MemoryController {
  constructor(private readonly memory: MemoryService) {}

  @Get('memory')
  @ApiOperation({
    summary: '사용자의 Memory 문서 인덱스',
    description: '각 항목 = `{path, frontmatter, updatedAt}` (본문 미포함).',
  })
  list(@Param('userId') userId: string) {
    return this.memory.listForUser(userId);
  }

  @Get('memory/*')
  @ApiOperation({
    summary: 'Memory 단일 문서 조회',
    description: '`*` 위치에 `profile`, `preferences`, `agents/{id}/SOUL` 같은 슬래시-경로가 들어갑니다.',
  })
  getOne(@Param('userId') userId: string, @Param('0') path: string) {
    return this.memory.getDoc(userId, path);
  }

  @Put('memory/*')
  @ApiOperation({
    summary: 'Memory 문서 upsert',
    description:
      '`frontmatter` 가 미제공이면 본문에서 gray-matter 로 자동 파싱해서 별도 컬럼에 저장.',
  })
  put(
    @Param('userId') userId: string,
    @Param('0') path: string,
    @Body() dto: PutMemoryDocumentDto,
  ) {
    return this.memory.putDoc(userId, path, dto);
  }

  @Post('log')
  @ApiOperation({
    summary: '활동 로그 prepend',
    description:
      '`path = "log"` 문서를 가져와 헤더 바로 아래에 한 줄 추가. 신규면 헤더 포함해 새로 만듭니다.',
  })
  appendLog(@Param('userId') userId: string, @Body() dto: AppendLogDto) {
    return this.memory.appendLog(userId, dto);
  }
}
