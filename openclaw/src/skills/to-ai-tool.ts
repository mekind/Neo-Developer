import { Skill, SkillContext } from './types';

export function toAITool(skill: Skill, context: SkillContext): any {
  return {
    description: skill.description,
    parameters: skill.schema,
    execute: async (args: any) => {
      return skill.execute(args, context);
    },
  };
}
