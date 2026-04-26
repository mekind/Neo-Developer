import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppendLogDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  link?: string;
}
