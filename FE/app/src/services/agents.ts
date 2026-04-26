import type { BackendAgentRecord, CreatedAgentRecord } from '@/game/agents'
import { isLpcFrameMap, isLpcState } from '@/game/lpcSprite'
import { getJson, postJson } from '@/lib/api-client'

function isBackendAgentRecord(value: unknown): value is BackendAgentRecord {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    (candidate.name === undefined || typeof candidate.name === 'string') &&
    (candidate.imageAsset === undefined || candidate.imageAsset === null || typeof candidate.imageAsset === 'string') &&
    (candidate.characterPngUrl === undefined || candidate.characterPngUrl === null || typeof candidate.characterPngUrl === 'string') &&
    (candidate.frameMap === undefined || candidate.frameMap === null || isLpcFrameMap(candidate.frameMap)) &&
    (candidate.creditsText === undefined || candidate.creditsText === null || typeof candidate.creditsText === 'string') &&
    (candidate.lpcState === undefined || candidate.lpcState === null || isLpcState(candidate.lpcState))
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
