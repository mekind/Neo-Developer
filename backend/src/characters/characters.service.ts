import { Injectable, Logger } from '@nestjs/common';
import { LpcCharacterClient } from './lpc-character.client';
import { GenerateCharacterDto } from './dto/generate-character.dto';
import { CharacterResponseDto } from './dto/character-response.dto';

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);

  constructor(private readonly lpcClient: LpcCharacterClient) {}

  async generateCharacter(dto: GenerateCharacterDto): Promise<CharacterResponseDto> {
    this.logger.log(`Generating character for agent: ${dto.agent_id}`);
    return this.lpcClient.generateCharacter(dto);
  }

  async getHealth() {
    return this.lpcClient.health();
  }
}
