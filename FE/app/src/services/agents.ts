import { getJson, postJson } from '@/lib/api-client'
import type { BackendAgentRecord, CreatedAgentRecord } from '@/game/agents'

function isBackendAgentRecord(value: unknown): value is BackendAgentRecord {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    (candidate.name === undefined || typeof candidate.name === 'string') &&
    (candidate.imageAsset === undefined || candidate.imageAsset === null || typeof candidate.imageAsset === 'string')
  )
}

function isCreatedAgentRecord(value: unknown): value is CreatedAgentRecord {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.name === 'string'
}

export async function listAgents() {
  const payload = await getJson('/agents')

  if (!Array.isArray(payload) || !payload.every(isBackendAgentRecord)) {
    throw new Error('Agent API response shape was invalid.')
  }

  return payload
}

export async function createAgent(input: { personaSummary: string; backstoryPrompt: string }) {
  const payload = await postJson('/agents', input)

  if (!isCreatedAgentRecord(payload)) {
    throw new Error('Agent create response shape was invalid.')
  }

  return payload
}
