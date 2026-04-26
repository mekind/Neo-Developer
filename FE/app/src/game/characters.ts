export type CharacterArchetype = 'scout' | 'maker' | 'spark'

export type WorldCharacterStatus = 'pending' | 'ready'

export type WorldCharacter = {
  id: string
  name: string
  archetype: CharacterArchetype
  x: number
  y: number
  color: string
  status: WorldCharacterStatus
  imageUrl?: string
}

export type CreatedAgent = {
  id: string
  name: string
  archetype: CharacterArchetype
  personaSummary: string
  backstoryPrompt: string
  imageUrl?: string
  createdAt: string
  updatedAt?: string
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

function getCharacterPalette(archetype: CharacterArchetype) {
  return archetypeOptions.find((option) => option.value === archetype) ?? archetypeOptions[0]
}

function getCharacterCoordinates(index: number) {
  return {
    x: 160 + (index % 4) * 180,
    y: 180 + Math.floor(index / 4) * 110,
  }
}

function buildAgentName(personaSummary: string) {
  const firstPhrase = personaSummary
    .trim()
    .split(/[.!?]/)[0]
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ')

  if (firstPhrase) {
    return firstPhrase
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  return 'New Agent'
}

function pickAgentArchetype(personaSummary: string, backstoryPrompt: string): CharacterArchetype {
  const signal = `${personaSummary} ${backstoryPrompt}`.toLowerCase()

  if (/(build|craft|organize|teacher|mentor|maker)/.test(signal)) {
    return 'maker'
  }

  if (/(art|creative|music|story|spark|energy|idea)/.test(signal)) {
    return 'spark'
  }

  return 'scout'
}

export function predictAgentIdentity(personaSummary: string, backstoryPrompt: string) {
  return {
    name: buildAgentName(personaSummary),
    archetype: pickAgentArchetype(personaSummary, backstoryPrompt),
  }
}

export function buildPendingWorldCharacter(personaSummary: string, backstoryPrompt: string, id: string, index: number): WorldCharacter {
  const identity = predictAgentIdentity(personaSummary, backstoryPrompt)
  const palette = getCharacterPalette(identity.archetype)

  return {
    id,
    name: identity.name,
    archetype: identity.archetype,
    color: palette.color,
    status: 'pending',
    ...getCharacterCoordinates(index),
  }
}

export function buildWorldCharacterFromAgent(agent: CreatedAgent, index: number): WorldCharacter {
  const palette = getCharacterPalette(agent.archetype)

  return {
    id: agent.id,
    name: agent.name,
    archetype: agent.archetype,
    color: palette.color,
    status: 'ready',
    imageUrl: agent.imageUrl,
    ...getCharacterCoordinates(index),
  }
}

export const clampToWorld = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const measureDistance = (from: Pick<WorldCharacter, 'x' | 'y'>, to: Pick<WorldCharacter, 'x' | 'y'>) =>
  Math.hypot(from.x - to.x, from.y - to.y)
