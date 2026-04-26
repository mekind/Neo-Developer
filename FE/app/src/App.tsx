import { useEffect, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import { buildWorldAgents, type WorldAgent } from '@/game/agents'
import { WorldCanvas } from '@/game/WorldCanvas'
import { listAgents } from '@/services/agents'

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

  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">demo-friendly baseline</p>
          <h1>편하게 둘러보는 데모 공간</h1>
        </div>
        <p className="topbar-copy">
          처음 보는 사람도 부담 없이 이해할 수 있도록, 백엔드에서 받은 agent roster가 따뜻한 중간 톤의 월드에
          랜덤 위치로 배치되는 흐름을 편하게 보여줍니다.
        </p>
      </header>

      <div className="app-body">
        <aside className="sidebar panel-shell">
          <InteractionPanel agents={agents} isLoading={isLoading} errorMessage={errorMessage} />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">World viewport</p>
            <p className="description">
              백엔드 agent 리스트가 로드될 때마다 새로운 랜덤 위치에 배치되고, 같은 로드 안에서는 가만히 머무르는
              첫 공유공간 데모입니다.
            </p>
          </div>
          <WorldCanvas agents={agents} isLoading={isLoading} errorMessage={errorMessage} />
        </section>
      </div>
    </main>
  )
}
