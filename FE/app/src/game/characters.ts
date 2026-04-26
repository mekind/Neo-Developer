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
  imageUrl: string
  createdAt: string
  updatedAt: string
}

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

export function createPendingWorldCharacter(id: string, name: string, archetype: CharacterArchetype, index: number): WorldCharacter {
  const palette = getCharacterPalette(archetype)

  return {
    id,
    name,
    archetype,
    color: palette.color,
    status: 'pending',
    ...getCharacterCoordinates(index),
  }
}

export function createReadyWorldCharacter(agent: CreatedAgent, index: number): WorldCharacter {
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
