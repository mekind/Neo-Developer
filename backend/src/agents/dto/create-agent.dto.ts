import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  personaSummary: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  backstoryPrompt: string;
}
