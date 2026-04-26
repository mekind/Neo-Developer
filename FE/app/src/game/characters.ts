export type CharacterArchetype = 'scout' | 'maker' | 'spark'

export type WorldCharacter = {
  id: string
  name: string
  archetype: CharacterArchetype
  x: number
  y: number
  color: string
}

export const WORLD_WIDTH = 1280
export const WORLD_HEIGHT = 720
export const WORLD_PADDING = 28
export const PLAYER_MOVE_STEP = 24
export const INTERACTION_RADIUS = 120

export const archetypeOptions: Array<{
  value: CharacterArchetype
  label: string
  description: string
  color: string
}> = [
  {
    value: 'scout',
    label: 'Scout',
    description: 'Fast explorer who maps the room first.',
    color: '#38bdf8',
  },
  {
    value: 'maker',
    label: 'Maker',
    description: 'Builder who sets up the shared space.',
    color: '#f59e0b',
  },
  {
    value: 'spark',
    label: 'Spark',
    description: 'Creative lead who energizes the world.',
    color: '#c084fc',
  },
]

export const clampToWorld = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const createWorldCharacter = (
  name: string,
  archetype: CharacterArchetype,
  index: number,
): WorldCharacter => {
  const palette = archetypeOptions.find((option) => option.value === archetype) ?? archetypeOptions[0]

  return {
    id: `${name}-${index + 1}`,
    name,
    archetype,
    color: palette.color,
    x: 160 + (index % 4) * 180,
    y: 180 + Math.floor(index / 4) * 110,
  }
}

export const measureDistance = (from: Pick<WorldCharacter, 'x' | 'y'>, to: Pick<WorldCharacter, 'x' | 'y'>) =>
  Math.hypot(from.x - to.x, from.y - to.y)
