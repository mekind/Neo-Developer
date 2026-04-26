import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCharacterDto {
  @ApiProperty({
    description: 'Persona in Markdown format',
    example: '# Persona\nA brave knight who protects the innocent.',
  })
  @IsString()
  @IsNotEmpty()
  persona_md: string;

  @ApiProperty({
    description: 'Identifier for the agent',
    example: 'news-bot',
  })
  @IsString()
  @IsNotEmpty()
  agent_id: string;
}
