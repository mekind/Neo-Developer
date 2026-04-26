import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppendLogDto {
  @ApiProperty({ description: '로그 이벤트 내용 (예: agent:abc:reply)' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiPropertyOptional({ description: '발생 시각 (ISO string)' })
  @IsString()
  @IsOptional()
  ts?: string;
}
