import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertProfileDto {
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  techLevel?: 'low' | 'medium' | 'high';
}
