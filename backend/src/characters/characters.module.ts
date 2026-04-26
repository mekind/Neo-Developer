import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { LpcCharacterClient } from './lpc-character.client';

@Module({
  controllers: [CharactersController],
  providers: [CharactersService, LpcCharacterClient],
  exports: [CharactersService],
})
export class CharactersModule {}
