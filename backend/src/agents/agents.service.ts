import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateAgentDto } from './dto/create-agent.dto';

export interface Agent {
  id: string;
  name: string;
  archetype: CreateAgentDto['archetype'];
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

const AGENT_THEMES: Record<CreateAgentDto['archetype'], { fill: string; accent: string }> = {
  scout: { fill: '#38bdf8', accent: '#0f4c5c' },
  maker: { fill: '#f59e0b', accent: '#7c4a03' },
  spark: { fill: '#c084fc', accent: '#5b2d90' },
};

@Injectable()
export class AgentsService {
  private readonly agents: Agent[] = [];

  async create(dto: CreateAgentDto): Promise<Agent> {
    await this.delay(250);

    const now = new Date().toISOString();
    const agent: Agent = {
      id: uuid(),
      name: dto.name.trim(),
      archetype: dto.archetype,
      imageUrl: this.buildImageUrl(dto),
      createdAt: now,
      updatedAt: now,
    };

    this.agents.push(agent);
    return agent;
  }

  private buildImageUrl(dto: CreateAgentDto) {
    const theme = AGENT_THEMES[dto.archetype];
    const initials = dto.name.trim().slice(0, 2).toUpperCase() || 'AG';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="${dto.name} avatar">
        <rect width="160" height="160" rx="28" fill="${theme.fill}" />
        <circle cx="80" cy="60" r="28" fill="rgba(255,255,255,0.82)" />
        <path d="M34 134c10-26 34-40 46-40s36 14 46 40" fill="rgba(255,255,255,0.82)" />
        <text x="80" y="150" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="${theme.accent}">${initials}</text>
      </svg>
    `.replace(/\s+/g, ' ').trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private async delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
