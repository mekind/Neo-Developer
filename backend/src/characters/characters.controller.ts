import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CharactersService } from './characters.service';
import { GenerateCharacterDto } from './dto/generate-character.dto';
import { CharacterResponseDto } from './dto/character-response.dto';

@ApiTags('characters')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new character image and configuration' })
  @ApiResponse({
    status: 201,
    description: 'Character successfully generated',
    type: CharacterResponseDto,
  })
  @ApiResponse({ status: 502, description: 'LPC Sidecar service error' })
  @ApiResponse({ status: 504, description: 'LPC Sidecar service timeout' })
  async generate(@Body() dto: GenerateCharacterDto): Promise<CharacterResponseDto> {
    return this.charactersService.generateCharacter(dto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check the health of the LPC Sidecar service' })
  async health() {
    return this.charactersService.getHealth();
  }
}
