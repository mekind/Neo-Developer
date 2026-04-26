import type { WorldAgent } from '@/game/agents'

type SidebarSectionProps = {
  agents: WorldAgent[]
  isLoading: boolean
  errorMessage: string | null
  lpcCreditsText: string | null
  lpcErrorMessage: string | null
  onOpenDialog: () => void
  onFocusAgent: (agentId: string) => void
}

export function SidebarSection({
  agents,
  isLoading,
  errorMessage,
  lpcCreditsText,
  lpcErrorMessage,
  onOpenDialog,
  onFocusAgent,
}: SidebarSectionProps) {
  return (
    <aside className="sidebar panel-shell">
      <section className="sidebar-content sidebar-content-polished">
        <section className="sidebar-card sidebar-cta" aria-label="Add agent entry">
          <div className="sidebar-card-head">
            <div>
              <p className="eyebrow">에이전트</p>
              <h2>에이전트 라운지</h2>
            </div>
            <span className="panel-count">{agents.length}</span>
          </div>

          <button type="button" className="sidebar-primary-button" onClick={onOpenDialog}>
            <span className="sidebar-primary-button__icon" aria-hidden="true">+</span>
            <span>에이전트 추가</span>
          </button>
        </section>

        <section className="sidebar-card sidebar-roster" aria-label="Backend agent list">
          <div className="sidebar-card-head">
            <h3>에이전트 목록</h3>
            <span className="panel-count">{agents.length}</span>
          </div>

          {isLoading ? <p className="sidebar-state-copy">에이전트 목록을 불러오는 중…</p> : null}
          {errorMessage ? <p className="sidebar-state-copy" role="alert">{errorMessage}</p> : null}

          {!isLoading && agents.length > 0 ? (
            <ul className="agent-list agent-list-polished" aria-label="Backend agent list">
              {agents.map((agent, index) => (
                <li key={agent.id}>
                  <button type="button" className="agent-list-button" onClick={() => onFocusAgent(agent.id)}>
                    <span className="agent-list-rank" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <strong>{agent.label}</strong>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {!isLoading && agents.length === 0 ? <p className="sidebar-state-copy">표시할 에이전트가 아직 없습니다.</p> : null}
        </section>

        <section className="sidebar-card sidebar-credits" aria-label="LPC 크레딧">
          <div className="sidebar-card-head">
            <h3>LPC 크레딧</h3>
            <span className="panel-count">표시중</span>
          </div>
          {lpcErrorMessage ? <p className="sidebar-state-copy" role="alert">{lpcErrorMessage}</p> : null}
          {lpcCreditsText ? <pre className="credits-text">{lpcCreditsText}</pre> : <p className="sidebar-state-copy">LPC 자산 크레딧을 불러오는 중…</p>}
        </section>
      </section>
    </aside>
  )
}
