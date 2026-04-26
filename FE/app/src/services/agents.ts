import { type CharacterArchetype, type CreatedAgent } from '@/game/characters'
import { postJson } from '@/lib/api-client'

export interface CreateAgentRequest {
  name: string
  archetype: CharacterArchetype
}

function isCreatedAgent(value: unknown): value is CreatedAgent {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.archetype === 'string' &&
    typeof candidate.imageUrl === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

export async function createAgent(request: CreateAgentRequest) {
  const payload = await postJson('/agents', request)

  if (!isCreatedAgent(payload)) {
    throw new Error('Agent API response shape was invalid.')
  }

  return payload
}
