import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const ARCHETYPES = ['scout', 'maker', 'spark'] as const;

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(ARCHETYPES)
  archetype: (typeof ARCHETYPES)[number];
}
