export type CharacterArchetype = 'scout' | 'maker' | 'spark'

export type WorldCharacter = {
  id: string
  name: string
  archetype: CharacterArchetype
  x: number
  y: number
  color: string
}

export type WorldObstacle = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

export const WORLD_WIDTH = 2400
export const WORLD_HEIGHT = 1350
export const WORLD_PADDING = 40
export const PLAYER_MOVE_STEP = 24
export const PLAYER_MOVE_SPEED = 220
export const PLAYER_RADIUS = 18
export const INTERACTION_RADIUS = 120
export const WORLD_VIEWPORT_HEIGHT = 720

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

export const WORLD_OBSTACLES: WorldObstacle[] = [
  { id: 'library-table', x: 300, y: 350, width: 320, height: 140, color: '#cfaf84' },
  { id: 'commons-table', x: 980, y: 460, width: 360, height: 150, color: '#d7b88c' },
  { id: 'cafe-table', x: 1680, y: 320, width: 280, height: 140, color: '#cfaf84' },
  { id: 'bench-row', x: 620, y: 920, width: 540, height: 110, color: '#d6b48b' },
  { id: 'window-planter', x: 1820, y: 860, width: 220, height: 220, color: '#8ea275' },
]

const CHARACTER_SPAWN_POINTS = [
  { x: 1180, y: 700 },
  { x: 1320, y: 700 },
  { x: 1180, y: 820 },
  { x: 1320, y: 820 },
  { x: 1040, y: 760 },
  { x: 1460, y: 760 },
]

export const createWorldCharacter = (
  name: string,
  archetype: CharacterArchetype,
  index: number,
): WorldCharacter => {
  const palette = archetypeOptions.find((option) => option.value === archetype) ?? archetypeOptions[0]
  const spawnPoint = CHARACTER_SPAWN_POINTS[index % CHARACTER_SPAWN_POINTS.length] ?? CHARACTER_SPAWN_POINTS[0]

  return {
    id: `${name}-${index + 1}`,
    name,
    archetype,
    color: palette.color,
    x: spawnPoint.x,
    y: spawnPoint.y,
  }
}

export const measureDistance = (from: Pick<WorldCharacter, 'x' | 'y'>, to: Pick<WorldCharacter, 'x' | 'y'>) =>
  Math.hypot(from.x - to.x, from.y - to.y)

const isCircleIntersectingObstacle = (
  x: number,
  y: number,
  radius: number,
  obstacle: Pick<WorldObstacle, 'x' | 'y' | 'width' | 'height'>,
) => {
  const closestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width))
  const closestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height))
  return Math.hypot(x - closestX, y - closestY) < radius
}

export const clampCharacterToMap = (
  character: WorldCharacter,
  nextX: number,
  nextY: number,
  obstacles: WorldObstacle[] = WORLD_OBSTACLES,
) => {
  const clampedX = clampToWorld(nextX, WORLD_PADDING + PLAYER_RADIUS, WORLD_WIDTH - WORLD_PADDING - PLAYER_RADIUS)
  const clampedY = clampToWorld(nextY, WORLD_PADDING + PLAYER_RADIUS, WORLD_HEIGHT - WORLD_PADDING - PLAYER_RADIUS)

  const canMoveToX = !obstacles.some((obstacle) => isCircleIntersectingObstacle(clampedX, character.y, PLAYER_RADIUS, obstacle))
  const canMoveToY = !obstacles.some((obstacle) => isCircleIntersectingObstacle(character.x, clampedY, PLAYER_RADIUS, obstacle))

  return {
    ...character,
    x: canMoveToX ? clampedX : character.x,
    y: canMoveToY ? clampedY : character.y,
  }
}
