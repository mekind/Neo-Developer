import { Injectable } from '@nestjs/common';

export interface AgentRecord {
  id: string;
  name?: string;
  imageAsset?: string | null;
}

function createAvatarDataUri(initials: string, fill: string, accent: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${initials} avatar">
      <rect width="96" height="96" rx="24" fill="${fill}" />
      <circle cx="48" cy="33" r="16" fill="#fff7ed" />
      <path d="M24 82c3-15 13-24 24-24s21 9 24 24" fill="#fff7ed" />
      <circle cx="48" cy="33" r="10" fill="${accent}" opacity="0.18" />
      <text x="48" y="89" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#fff7ed">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

@Injectable()
export class AgentsService {
  private readonly agents: AgentRecord[] = [
    {
      id: 'mentor-hana',
      name: 'Hana',
      imageAsset: createAvatarDataUri('HA', '#fb923c', '#7c2d12'),
    },
    {
      id: 'guide-min',
      name: 'Min',
      imageAsset: null,
    },
    {
      id: 'buddy-juno',
      name: 'Juno',
      imageAsset: createAvatarDataUri('JU', '#38bdf8', '#0f172a'),
    },
    {
      id: 'coach-ara',
      name: 'Ara',
      imageAsset: createAvatarDataUri('AR', '#c084fc', '#4c1d95'),
    },
  ];

  findAll(): AgentRecord[] {
    return this.agents;
  }
}
