import { type CharacterArchetype } from '@/game/characters'
import { getJson, postJson } from '@/lib/api-client'

export interface CreateAgentPayload {
  personaSummary: string
  backstoryPrompt: string
}

export interface CreatedAgent {
  id: string
  name: string
  archetype: CharacterArchetype
  personaSummary: string
  backstoryPrompt: string
  createdAt: string
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
    typeof candidate.createdAt === 'string'
  )
}

function isCreatedAgentList(value: unknown): value is CreatedAgent[] {
  return Array.isArray(value) && value.every(isCreatedAgent)
}

export async function listAgents() {
  const response = await getJson('/agents')

  if (!isCreatedAgentList(response)) {
    throw new Error('API response shape was invalid.')
  }

  return response
}

export async function createAgent(payload: CreateAgentPayload) {
  const response = await postJson('/agents', payload)

  if (!isCreatedAgent(response)) {
    throw new Error('API response shape was invalid.')
  }

  return response
}
