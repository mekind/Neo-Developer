import { getJson } from '@/lib/api-client'
import type { BackendAgentRecord } from '@/game/agents'

function isBackendAgentRecord(value: unknown): value is BackendAgentRecord {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    (candidate.name === undefined || typeof candidate.name === 'string') &&
    (candidate.imageAsset === undefined || candidate.imageAsset === null || typeof candidate.imageAsset === 'string')
  )
}

export async function listAgents() {
  const payload = await getJson('/agents')

  if (!Array.isArray(payload) || !payload.every(isBackendAgentRecord)) {
    throw new Error('Agent API response shape was invalid.')
  }

  return payload
}
