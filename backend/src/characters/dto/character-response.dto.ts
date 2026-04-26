import { ApiProperty } from '@nestjs/swagger';

export class MappingTrace {
  @ApiProperty({ required: false, nullable: true })
  form_fallback_note: string | null;

  @ApiProperty({ type: [Object] })
  trace: any[];

  @ApiProperty()
  color_palette_check: Record<string, any>;
}

export class CharacterResponseDto {
  @ApiProperty({ description: 'Base64 encoded PNG image data' })
  character_png_b64: string;

  @ApiProperty({ description: 'LPC state configuration' })
  lpc_state: Record<string, any>;

  @ApiProperty({ description: 'Animation frame mapping' })
  frame_map: Record<string, any>;

  @ApiProperty({ description: 'License and credits information (must be displayed to user)' })
  credits: string;

  @ApiProperty({ description: 'Trace information for mapping process' })
  mapping_trace: MappingTrace;
}
