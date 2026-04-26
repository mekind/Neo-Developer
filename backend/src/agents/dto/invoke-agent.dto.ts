import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InvokeAgentDto {
  @ApiProperty({
    description: '에이전트에게 보낼 메시지',
    example: '안녕! 너는 누구야?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
