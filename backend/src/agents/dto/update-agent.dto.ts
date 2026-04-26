import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  persona?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  soul?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
