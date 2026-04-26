import { type CreatedAgent } from '@/game/characters'
import { postJson } from '@/lib/api-client'

export interface CreateAgentPayload {
  personaSummary: string
  backstoryPrompt: string
}

function isCreatedAgent(value: unknown): value is CreatedAgent {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    (candidate.archetype === 'scout' || candidate.archetype === 'maker' || candidate.archetype === 'spark') &&
    typeof candidate.personaSummary === 'string' &&
    typeof candidate.backstoryPrompt === 'string' &&
    (candidate.imageUrl === undefined || typeof candidate.imageUrl === 'string') &&
    typeof candidate.createdAt === 'string' &&
    (candidate.updatedAt === undefined || typeof candidate.updatedAt === 'string')
  )
}

export async function createAgent(payload: CreateAgentPayload) {
  const response = await postJson('/agents', payload)

  if (!isCreatedAgent(response)) {
    throw new Error('Agent API response shape was invalid.')
  }

  return response
}
