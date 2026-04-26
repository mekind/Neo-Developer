import { useEffect, useMemo, useState } from 'react'

import { buildWorldAgentForAppend, buildWorldAgents, type WorldAgent } from '@/game/agents'
import { createAgent, invokeAgent, listAgents } from '@/services/agents'

type ChatMessage = {
  id: string
  role: 'user' | 'agent'
  text: string
  meta?: string
}

type AmbientSpeechState = {
  text: string
  visibleUntil: number
}

const AMBIENT_GREETING_PROMPT = '첫인사 짧게 해줘'
const AMBIENT_GREETING_MIN_MS = 5000
const AMBIENT_GREETING_MAX_MS = 15000
const AMBIENT_GREETING_VISIBLE_MS = 2800

function nextAmbientGreetingDelay() {
  return AMBIENT_GREETING_MIN_MS + Math.random() * (AMBIENT_GREETING_MAX_MS - AMBIENT_GREETING_MIN_MS)
}

function toSpeechPreview(text: string) {
  return Array.from(text.trim()).slice(0, 10).join('')
}

function createChatMessage(role: ChatMessage['role'], text: string, meta?: string): ChatMessage {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${role}-${Date.now()}-${Math.random()}`,
    role,
    text,
    meta,
  }
}

export function useAgentsPage() {
  const [backendAgents, setBackendAgents] = useState<WorldAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeChatAgent, setActiveChatAgent] = useState<WorldAgent | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessagesByAgentId, setChatMessagesByAgentId] = useState<Record<string, ChatMessage[]>>({})
  const [isChatSubmitting, setIsChatSubmitting] = useState(false)
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<{ agentId: string; requestId: number } | null>(null)
  const [ambientSpeechByAgentId, setAmbientSpeechByAgentId] = useState<Record<string, AmbientSpeechState>>({})

  const agents = useMemo(() => backendAgents, [backendAgents])
  const activeChatMessages = activeChatAgent ? (chatMessagesByAgentId[activeChatAgent.id] ?? []) : []

  useEffect(() => {
    let isMounted = true

    async function loadAgents() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const nextAgents = buildWorldAgents(await listAgents())
        if (!isMounted) return
        setBackendAgents(nextAgents)
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : '에이전트 목록을 불러오지 못했습니다.')
        setBackendAgents(buildWorldAgents([]))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadAgents()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (import.meta.env.MODE === 'test' || agents.length === 0) return

    let cancelled = false
    const timeoutByAgentId = new Map<string, ReturnType<typeof setTimeout>>()
    const inFlight = new Set<string>()

    const schedule = (agentId: string, delay: number) => {
      const existing = timeoutByAgentId.get(agentId)
      if (existing) clearTimeout(existing)

      const timeoutId = setTimeout(async () => {
        if (cancelled || inFlight.has(agentId)) return
        inFlight.add(agentId)

        try {
          const response = await invokeAgent(agentId, AMBIENT_GREETING_PROMPT)
          if (cancelled) return

          const preview = toSpeechPreview(response.reply)
          if (preview) {
            setAmbientSpeechByAgentId((current) => ({
              ...current,
              [agentId]: {
                text: preview,
                visibleUntil: Date.now() + AMBIENT_GREETING_VISIBLE_MS,
              },
            }))
          }
        } catch {
          // best-effort ambient greeting only
        } finally {
          inFlight.delete(agentId)
          if (!cancelled) schedule(agentId, nextAmbientGreetingDelay())
        }
      }, delay)

      timeoutByAgentId.set(agentId, timeoutId)
    }

    const activeIds = new Set(agents.map((agent) => agent.id))
    setAmbientSpeechByAgentId((current) => {
      const nextEntries = Object.entries(current).filter(([agentId]) => activeIds.has(agentId))
      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries)
    })

    agents.forEach((agent) => schedule(agent.id, nextAmbientGreetingDelay()))

    return () => {
      cancelled = true
      timeoutByAgentId.forEach((timeoutId) => clearTimeout(timeoutId))
    }
  }, [agents])

  const handleCreateAgent = async (name: string, persona: string) => {
    const created = await createAgent({
      name,
      personaSummary: persona,
    })

    setBackendAgents((current) => [...current, buildWorldAgentForAppend(current, created)])
  }

  const handleAgentInteraction = (agent: WorldAgent) => {
    setChatErrorMessage(null)
    setActiveChatAgent(agent)
    setIsChatOpen(true)
  }

  const handleOpenChat = () => {
    const firstAgent = agents[0]
    if (!firstAgent) return
    handleAgentInteraction(firstAgent)
  }

  const handleCloseChat = () => {
    setChatErrorMessage(null)
    setIsChatOpen(false)
  }

  const handleSendChatMessage = async (message: string) => {
    const trimmed = message.trim()
    if (!trimmed || !activeChatAgent) return

    const nextUserMessage = createChatMessage('user', trimmed)
    setChatMessagesByAgentId((current) => ({
      ...current,
      [activeChatAgent.id]: [...(current[activeChatAgent.id] ?? []), nextUserMessage],
    }))

    try {
      setIsChatSubmitting(true)
      setChatErrorMessage(null)
      const response = await invokeAgent(activeChatAgent.id, trimmed)
      const meta = response.usedSkills.length > 0 ? `사용 스킬: ${response.usedSkills.join(', ')}` : response.refusedReason ? `거절 사유: ${response.refusedReason}` : undefined
      const replyMessage = createChatMessage('agent', response.reply, meta)
      setChatMessagesByAgentId((current) => ({
        ...current,
        [activeChatAgent.id]: [...(current[activeChatAgent.id] ?? []), replyMessage],
      }))
    } catch (error) {
      setChatErrorMessage(error instanceof Error ? error.message : '에이전트 응답을 가져오지 못했습니다.')
    } finally {
      setIsChatSubmitting(false)
    }
  }

  const handleFocusAgent = (agentId: string) => {
    setFocusRequest((current) => ({
      agentId,
      requestId: (current?.requestId ?? 0) + 1,
    }))
  }

  return {
    agents,
    isLoading,
    errorMessage,
    isDialogOpen,
    activeChatAgent,
    isChatOpen,
    chatMessages: activeChatMessages,
    isChatSubmitting,
    chatErrorMessage,
    focusRequest,
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
    closeChatDialog: handleCloseChat,
    handleCreateAgent,
    handleAgentInteraction,
    handleOpenChat,
    handleSendChatMessage,
    handleFocusAgent,
    ambientSpeechByAgentId,
  }
}
