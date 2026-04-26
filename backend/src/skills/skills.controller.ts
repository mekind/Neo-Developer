import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  @ApiOperation({
    summary: '활성화된 사전 정의 Skill 목록',
    description: 'Persona Builder가 사용자 의도와 매칭할 수 있는 Skill 카탈로그.',
  })
  list() {
    return this.skills.listEnabled();
  }
}
