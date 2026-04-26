import { insaneSearchSkill } from './insane-search';
import { Skill } from './types';

export const skillRegistry: Record<string, Skill> = {
  'insane-search': insaneSearchSkill,
};

export type SkillName = keyof typeof skillRegistry;
