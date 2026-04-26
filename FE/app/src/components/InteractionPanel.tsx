import type { WorldAgent } from '@/game/agents'

type InteractionPanelProps = {
  agents: WorldAgent[]
  isLoading: boolean
  errorMessage: string | null
}

const futureActions = [
  'Agent 상세 패널은 다음 단계에서 확장 가능',
  '실시간 위치 동기화는 이후 단계에서 연결',
  '애니메이션/상태 배지는 이번 패스 범위 밖',
]

export function InteractionPanel({ agents, isLoading, errorMessage }: InteractionPanelProps) {
  return (
    <section>
      <h2>Backend Agent Roster</h2>
      <p>현재 월드에 표시되는 agent 목록을 백엔드 응답 기준으로 단순하게 보여줍니다.</p>

      <section className="panel-section" aria-label="Backend agent summary">
        <h3>Loaded agents</h3>
        {isLoading ? <p>Loading backend agents…</p> : null}
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        {!isLoading && !errorMessage ? <p>{agents.length} backend agents are ready for the world.</p> : null}
      </section>

      <section className="panel-section" aria-label="Backend agent list">
        <h3>Agent list</h3>
        {!isLoading && !errorMessage && agents.length > 0 ? (
          <ul className="action-list" aria-label="Backend agent list">
            {agents.map((agent) => (
              <li key={agent.id}>
                {agent.label}
                {agent.usesPlaceholder ? ' · placeholder image' : ' · image asset'}
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading && !errorMessage && agents.length === 0 ? <p>No backend agents were returned.</p> : null}
      </section>

      <ul className="action-list muted-list">
        {futureActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </section>
  )
}
