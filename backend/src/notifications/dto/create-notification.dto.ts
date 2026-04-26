import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: '에이전트 uuid (선택)' })
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiProperty({ description: '알림 유형', enum: ['alert', 'message'] })
  @IsIn(['alert', 'message'])
  kind: string;

  @ApiProperty({ description: '알림 내용' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: '추가 메타데이터 (예: used_skills)' })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;

  @ApiPropertyOptional({ description: '발생 시각 (선택)' })
  @IsDateString()
  @IsOptional()
  ts?: string;
}
