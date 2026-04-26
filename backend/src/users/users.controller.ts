import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @ApiOperation({
    summary: '익명 사용자 생성',
    description: '서버가 uuid를 발급. 클라이언트는 이 id를 로컬 저장 후 모든 후속 호출에 사용.',
  })
  create() {
    return this.users.create();
  }

  @Get(':id')
  @ApiOperation({ summary: '사용자 + 프로필 조회 (없으면 profile=null)' })
  @ApiParam({ name: 'id', description: '사용자 uuid' })
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id/profile')
  @ApiOperation({
    summary: '프로필 upsert (온보딩 결과 반영)',
    description: '닉네임/목적/기술수준 갱신. 처음이면 생성, 있으면 덮어씀.',
  })
  @ApiParam({ name: 'id', description: '사용자 uuid' })
  upsertProfile(@Param('id') id: string, @Body() dto: UpsertProfileDto) {
    return this.users.upsertProfile(id, dto);
  }
}
