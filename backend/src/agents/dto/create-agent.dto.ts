import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  persona: Record<string, unknown>;

  @IsObject()
  soul: Record<string, unknown>;

  @IsObject()
  config: Record<string, unknown>;
}
