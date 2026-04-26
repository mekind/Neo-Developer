import { useEffect, useMemo, useState } from 'react'

import { buildWorldAgents, createLocalWorldAgent, type CreatedAgentRecord, type WorldAgent } from '@/game/agents'
import { listAgents } from '@/services/agents'

const DUMMY_AGENT_SEEDS: CreatedAgentRecord[] = [
  {
    id: 'dummy-haru',
    name: 'Haru',
    personaSummary: '밝게 인사하는 더미 NPC',
  },
  {
    id: 'dummy-miso',
    name: 'Miso',
    personaSummary: '조용히 길을 안내하는 더미 NPC',
  },
]

export function useAgentsPage() {
  const [backendAgents, setBackendAgents] = useState<WorldAgent[]>([])
  const [localAgents, setLocalAgents] = useState<WorldAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeChatAgent, setActiveChatAgent] = useState<WorldAgent | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const agents = useMemo(() => [...backendAgents, ...localAgents], [backendAgents, localAgents])

  useEffect(() => {
    let isMounted = true

    async function loadAgents() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const nextAgents = buildWorldAgents(await listAgents())
        if (!isMounted) return
        setBackendAgents(nextAgents)
        setLocalAgents((current) => {
          const nextLocalAgents = [...current]
          for (const seed of DUMMY_AGENT_SEEDS) {
            if (nextLocalAgents.some((agent) => agent.id === seed.id)) continue
            nextLocalAgents.push(createLocalWorldAgent([...nextAgents, ...nextLocalAgents], seed))
          }
          return nextLocalAgents
        })
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load backend agents.')
        setBackendAgents([])
        setLocalAgents((current) => {
          const nextLocalAgents = [...current]
          for (const seed of DUMMY_AGENT_SEEDS) {
            if (nextLocalAgents.some((agent) => agent.id === seed.id)) continue
            nextLocalAgents.push(createLocalWorldAgent(nextLocalAgents, seed))
          }
          return nextLocalAgents
        })
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
    const created: CreatedAgentRecord = {
      id: `local-agent-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      name,
      personaSummary: persona,
      createdAt: new Date().toISOString(),
    }

    setLocalAgents((current) => [...current, createLocalWorldAgent([...backendAgents, ...current], created)])
  }

  const handleAgentInteraction = (agent: WorldAgent) => {
    setActiveChatAgent(agent)
    setIsChatOpen(true)
  }

  const handleOpenTestChat = () => {
    const firstAgent = agents[0]
    if (!firstAgent) return
    handleAgentInteraction(firstAgent)
  }

  return {
    agents,
    isLoading,
    errorMessage,
    isDialogOpen,
    activeChatAgent,
    isChatOpen,
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
    closeChatDialog: () => setIsChatOpen(false),
    handleCreateAgent,
    handleAgentInteraction,
    handleOpenTestChat,
  }
}
