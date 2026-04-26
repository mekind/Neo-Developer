import { SkillContext } from '../skills/types';
import { skillRegistry } from '../skills';
import { toAITool } from '../skills/to-ai-tool';
import { Tool } from 'ai';

export function selectSkills(enabledSkillIds: string[] | undefined, context: SkillContext): Record<string, Tool<any, any>> {
  const selectedTools: Record<string, Tool<any, any>> = {};

  if (!enabledSkillIds || !Array.isArray(enabledSkillIds)) {
    return selectedTools;
  }

  for (const skillId of enabledSkillIds) {
    const skill = skillRegistry[skillId];
    if (skill) {
      selectedTools[skillId] = toAITool(skill, context);
    }
  }

  return selectedTools;
}
