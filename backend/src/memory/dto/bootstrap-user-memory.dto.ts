import { IsArray, IsOptional, IsString } from 'class-validator';

export class BootstrapUserMemoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
