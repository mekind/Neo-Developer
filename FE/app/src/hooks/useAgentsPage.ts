import { useEffect, useMemo, useState } from 'react'

import { buildWorldAgentForAppend, buildWorldAgents, type WorldAgent } from '@/game/agents'
import { createAgent, invokeAgent, listAgents } from '@/services/agents'

type ChatMessage = {
  id: string
  role: 'user' | 'agent'
  text: string
  meta?: string
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
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
    closeChatDialog: handleCloseChat,
    handleCreateAgent,
    handleAgentInteraction,
    handleOpenChat,
    handleSendChatMessage,
  }
}
