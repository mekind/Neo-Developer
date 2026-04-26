import { IsObject, IsOptional, IsString } from 'class-validator';

export class PutMemoryDocumentDto {
  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  frontmatter?: Record<string, unknown>;
}
