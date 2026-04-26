import { getJson, postJson } from '@/lib/api-client'
import type { BackendAgentRecord } from '@/game/agents'
import { isLpcFrameMap, isLpcState } from '@/game/lpcSprite'

const USER_STORAGE_KEY = 'myclaw-user-id'

export type AgentConversationReply = {
  reply: string
  usedSkills: string[]
  refusedReason: string | null
}

type BackendUserRecord = {
  id: string
}

type BackendInvokeRecord = {
  reply: string
  used_skills?: string[]
  refused?: {
    reason?: string
  } | null
}

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

let cachedUserId: string | null = null
let userBootstrapPromise: Promise<string> | null = null

function getStorage(): BrowserStorage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function isBackendUserRecord(value: unknown): value is BackendUserRecord {
  if (typeof value !== 'object' || value === null) return false
  return typeof (value as Record<string, unknown>).id === 'string'
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

async function validateStoredUser(userId: string) {
  try {
    const payload = await getJson(`/users/${userId}`)
    return isBackendUserRecord(payload)
  } catch {
    return false
  }
}

async function createUser() {
  const payload = await postJson('/users')

  if (!isBackendUserRecord(payload)) {
    throw new Error('User bootstrap response shape was invalid.')
  }

  return payload.id
}

export async function ensureUserId() {
  if (cachedUserId) return cachedUserId
  if (userBootstrapPromise) return userBootstrapPromise

  userBootstrapPromise = (async () => {
    const storage = getStorage()
    const storedUserId = storage?.getItem(USER_STORAGE_KEY)?.trim() ?? ''

    if (storedUserId && (await validateStoredUser(storedUserId))) {
      cachedUserId = storedUserId
      return storedUserId
    }

    if (storedUserId) {
      storage?.removeItem(USER_STORAGE_KEY)
    }

    const nextUserId = await createUser()
    storage?.setItem(USER_STORAGE_KEY, nextUserId)
    cachedUserId = nextUserId
    return nextUserId
  })()

  try {
    return await userBootstrapPromise
  } finally {
    userBootstrapPromise = null
  }
}

export async function listAgents() {
  const userId = await ensureUserId()
  const payload = await getJson(`/users/${userId}/agents`)

  if (!Array.isArray(payload) || !payload.every(isBackendAgentRecord)) {
    throw new Error('Agent API response shape was invalid.')
  }

  return payload
}

export async function createAgent(input: { name: string; personaSummary: string }) {
  const userId = await ensureUserId()
  const payload = await postJson(`/users/${userId}/agents`, {
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
  const userId = await ensureUserId()
  const payload = await postJson(`/users/${userId}/agents/${agentId}/invoke`, { message })

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

export function resetAgentSessionForTests() {
  cachedUserId = null
  userBootstrapPromise = null
}
