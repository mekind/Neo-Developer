import { useEffect, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import { appendCreatedAgent, buildWorldAgents, type WorldAgent } from '@/game/agents'
import { WorldCanvas } from '@/game/WorldCanvas'
import { createAgent, listAgents } from '@/services/agents'

export default function App() {
  const [agents, setAgents] = useState<WorldAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">Neo Commons</p>
          <h1>스쿨 커먼즈</h1>
        </div>
        <div className="topbar-summary" aria-label="Room summary">
          <span className="status-pill">Live</span>
          <strong>{agents.length}</strong>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar panel-shell">
          <InteractionPanel
            agents={agents}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onCreateAgent={handleCreateAgent}
          />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">Room</p>
            <h2>Commons Floor</h2>
            <p className="description">NeoD처럼 Phaser가 월드 surface를 직접 렌더링하고 React는 외곽 UI를 맡습니다.</p>
          </div>
          <WorldCanvas agents={agents} isLoading={isLoading} errorMessage={errorMessage} />
        </section>
      </div>
    </main>
  )
}
