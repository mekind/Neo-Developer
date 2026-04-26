import { getJson, postJson } from '@/lib/api-client'
import type { BackendAgentRecord } from '@/game/agents'
import { isLpcFrameMap, isLpcState } from '@/game/lpcSprite'

const FIXED_USER_ID = '5c4a5a9b-ac4f-4e2f-a7ba-4d7e93bd2e86'

export type AgentConversationReply = {
  reply: string
  usedSkills: string[]
  refusedReason: string | null
}

type BackendInvokeRecord = {
  reply: string
  used_skills?: string[]
  refused?: {
    reason?: string
  } | null
}

function isBackendAgentRecord(value: unknown): value is BackendAgentRecord {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    (candidate.name === undefined || typeof candidate.name === 'string') &&
    (candidate.persona === undefined || candidate.persona === null || typeof candidate.persona === 'object') &&
    (candidate.imageAsset === undefined || candidate.imageAsset === null || typeof candidate.imageAsset === 'string') &&
    (candidate.characterPngUrl === undefined || candidate.characterPngUrl === null || typeof candidate.characterPngUrl === 'string') &&
    (candidate.frameMap === undefined || candidate.frameMap === null || isLpcFrameMap(candidate.frameMap)) &&
    (candidate.creditsText === undefined || candidate.creditsText === null || typeof candidate.creditsText === 'string') &&
    (candidate.lpcState === undefined || candidate.lpcState === null || isLpcState(candidate.lpcState))
  )
}

function isBackendInvokeRecord(value: unknown): value is BackendInvokeRecord {
  if (typeof value !== 'object' || value === null) return false
  return typeof (value as Record<string, unknown>).reply === 'string'
}

export function ensureUserId() {
  return FIXED_USER_ID
}

export async function listAgents() {
  const payload = await getJson(`/users/${ensureUserId()}/agents`)

  if (!Array.isArray(payload) || !payload.every(isBackendAgentRecord)) {
    throw new Error('Agent API response shape was invalid.')
  }

  return payload
}

export async function createAgent(input: { name: string; personaSummary: string }) {
  const payload = await postJson(`/users/${ensureUserId()}/agents`, {
    name: input.name,
    persona: {
      summary: input.personaSummary,
    },
    soul: {
      formality: '존댓말',
      greetings_approach: ['안녕하세요! 무엇을 도와드릴까요?'],
      greetings_alert: ['새로운 소식이 있어요!'],
    },
    config: {
      version: 1,
      mode: 'chat',
    },
  })

  if (!isBackendAgentRecord(payload)) {
    throw new Error('Agent create response shape was invalid.')
  }

  return payload
}

export async function invokeAgent(agentId: string, message: string): Promise<AgentConversationReply> {
  const payload = await postJson(`/users/${ensureUserId()}/agents/${agentId}/invoke`, { message })

  if (!isBackendInvokeRecord(payload)) {
    throw new Error('Agent invoke response shape was invalid.')
  }

  return {
    reply: payload.reply,
    usedSkills: Array.isArray(payload.used_skills)
      ? payload.used_skills.filter((entry): entry is string => typeof entry === 'string')
      : [],
    refusedReason: payload.refused?.reason ?? null,
  }
}

export function resetAgentSessionForTests() {}
