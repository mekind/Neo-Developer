import type { WorldAgent } from '@/game/agents'

type SidebarSectionProps = {
  agents: WorldAgent[]
  isLoading: boolean
  errorMessage: string | null
  onOpenDialog: () => void
}

export function SidebarSection({ agents, isLoading, errorMessage, onOpenDialog }: SidebarSectionProps) {
  return (
    <aside className="sidebar panel-shell">
      <section className="sidebar-content sidebar-content-polished">
        <section className="sidebar-card sidebar-cta" aria-label="Add agent entry">
          <div className="sidebar-card-head">
            <div>
              <p className="eyebrow">Agents</p>
              <h2>Agent Lobby</h2>
            </div>
            <span className="panel-count">{agents.length}</span>
          </div>

          <button type="button" className="sidebar-primary-button" onClick={onOpenDialog}>
            <span className="sidebar-primary-button__icon" aria-hidden="true">
              +
            </span>
            <span>Add agent</span>
          </button>
        </section>

        <section className="sidebar-card sidebar-roster" aria-label="Backend agent list">
          <div className="sidebar-card-head">
            <h3>Agent list</h3>
            <span className="panel-count">{agents.length}</span>
          </div>

          {isLoading ? <p className="sidebar-state-copy">Loading backend agents…</p> : null}
          {errorMessage ? <p className="sidebar-state-copy" role="alert">{errorMessage}</p> : null}

          {!isLoading && agents.length > 0 ? (
            <ul className="agent-list agent-list-polished" aria-label="Backend agent list">
              {agents.map((agent, index) => (
                <li key={agent.id}>
                  <span className="agent-list-rank" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <strong>{agent.label}</strong>
                </li>
              ))}
            </ul>
          ) : null}

          {!isLoading && agents.length === 0 ? (
            <p className="sidebar-state-copy">No backend agents were returned.</p>
          ) : null}
        </section>
      </section>
    </aside>
  )
}
