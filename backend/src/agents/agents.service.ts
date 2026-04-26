import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateAgentDto } from './dto/create-agent.dto';

export interface AgentCharacter {
  id: string;
  name: string;
  archetype: 'scout' | 'maker' | 'spark';
  personaSummary: string;
  backstoryPrompt: string;
  createdAt: string;
}

@Injectable()
export class AgentsService {
  create(dto: CreateAgentDto): AgentCharacter {
    return {
      id: uuid(),
      name: this.buildName(dto.personaSummary),
      archetype: this.pickArchetype(dto.personaSummary, dto.backstoryPrompt),
      personaSummary: dto.personaSummary.trim(),
      backstoryPrompt: dto.backstoryPrompt.trim(),
      createdAt: new Date().toISOString(),
    };
  }

  private buildName(personaSummary: string) {
    const firstPhrase = personaSummary
      .trim()
      .split(/[.!?]/)[0]
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ');

    if (firstPhrase) {
      return firstPhrase
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    return 'New Agent';
  }

  private pickArchetype(personaSummary: string, backstoryPrompt: string): AgentCharacter['archetype'] {
    const signal = `${personaSummary} ${backstoryPrompt}`.toLowerCase();

    if (/(build|craft|organize|teacher|mentor|maker)/.test(signal)) {
      return 'maker';
    }

    if (/(art|creative|music|story|spark|energy|idea)/.test(signal)) {
      return 'spark';
    }

    return 'scout';
  }
}
