import { useEffect, useState } from 'react'

import { appendCreatedAgent, buildWorldAgents, type WorldAgent } from '@/game/agents'
import { createAgent, listAgents } from '@/services/agents'

export function useAgentsPage() {
  const [agents, setAgents] = useState<WorldAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadAgents() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const nextAgents = await listAgents()
        if (isMounted) {
          setAgents(buildWorldAgents(nextAgents))
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load backend agents.')
          setAgents([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAgents()

    return () => {
      isMounted = false
    }
  }, [])

  const handleCreateAgent = async (personaSummary: string, backstoryPrompt: string) => {
    const created = await createAgent({ personaSummary, backstoryPrompt })
    setAgents((current) => appendCreatedAgent(current, created))
  }

  return {
    agents,
    isLoading,
    errorMessage,
    isDialogOpen,
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
    handleCreateAgent,
  }
}
