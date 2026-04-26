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
      <section className="sidebar-content">
        <section className="panel-section creation-launcher" aria-label="Add agent entry">
          <div className="panel-label-row">
            <h2>Agents</h2>
            <span className="panel-count">{agents.length}</span>
          </div>
          <button type="button" onClick={onOpenDialog}>
            Add agent
          </button>
        </section>

        <section className="panel-section" aria-label="Backend agent list">
          <div className="panel-label-row">
            <h3>Agent list</h3>
            <span className="panel-count">{agents.length}</span>
          </div>

          {isLoading ? <p>Loading backend agents…</p> : null}
          {errorMessage ? <p role="alert">{errorMessage}</p> : null}

          {!isLoading && !errorMessage && agents.length > 0 ? (
            <ul className="agent-list" aria-label="Backend agent list">
              {agents.map((agent) => (
                <li key={agent.id}>
                  <strong>{agent.label}</strong>
                  <span>{agent.usesPlaceholder ? 'placeholder' : 'asset'}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {!isLoading && !errorMessage && agents.length === 0 ? <p>No backend agents were returned.</p> : null}
        </section>
      </section>
    </aside>
  )
}
