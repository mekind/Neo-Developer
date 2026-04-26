import { useEffect, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import { buildWorldAgents, type WorldAgent } from '@/game/agents'
import { WorldCanvas, type CurrentUser } from '@/game/WorldCanvas'
import { listAgents } from '@/services/agents'

export default function App() {
  const [agents, setAgents] = useState<WorldAgent[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: 'current-user',
    label: 'You',
    x: 1200,
    y: 760,
  })
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

  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">Neo Commons</p>
          <h1>스쿨 커먼즈</h1>
        </div>
        <div className="topbar-summary" aria-label="Room summary">
          <span className="status-pill">Live</span>
          <strong>{agents.length + 1}</strong>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar panel-shell">
          <InteractionPanel
            agents={agents}
            currentUser={currentUser}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">Room</p>
            <h2>Commons Floor</h2>
            <p className="description">
              NeoD처럼 Phaser가 월드 surface를 직접 렌더링하고 React는 외곽 UI를 맡습니다. 기본적으로 현재 사용자
              1명이 화면에 있고, WASD/방향키로 움직일 수 있습니다.
            </p>
          </div>
          <WorldCanvas
            agents={agents}
            currentUser={currentUser}
            onCurrentUserChange={setCurrentUser}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </section>
      </div>
    </main>
  )
}
