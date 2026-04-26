import type { WorldAgent, WorldPlayer } from '@/game/agents'

type SidebarSectionProps = {
  agents: WorldAgent[]
  player: WorldPlayer
  isLoading: boolean
  errorMessage: string | null
  onOpenDialog: () => void
}

export function SidebarSection({ agents, player, isLoading, errorMessage, onOpenDialog }: SidebarSectionProps) {
  return (
    <aside className="sidebar panel-shell">
      <section className="sidebar-content">
        <div className="sidebar-head">
          <p className="eyebrow">Room panel</p>
          <h2>Agents</h2>
        </div>

        <section className="panel-section panel-highlight" aria-label="Current player summary">
          <div className="panel-label-row">
            <span className="panel-kicker">Player</span>
            <span className="panel-count">1</span>
          </div>
          <p>
            <strong>{player.label}</strong> is the controllable user avatar.
          </p>
          <p>Move with WASD or arrow keys. Press E near an agent NPC to interact.</p>
        </section>

        <section className="panel-section creation-launcher" aria-label="Add agent entry">
          <div className="panel-label-row">
            <h3>Add agent</h3>
            <span className="panel-count">+</span>
          </div>
          <button type="button" onClick={onOpenDialog}>
            Add agent
          </button>
        </section>

        <section className="panel-section panel-highlight" aria-label="Backend agent summary">
          <div className="panel-label-row">
            <span className="panel-kicker">Status</span>
            <span className="panel-count">{agents.length}</span>
          </div>
          {isLoading ? <p>Loading backend agents…</p> : null}
          {errorMessage ? <p role="alert">{errorMessage}</p> : null}
          {!isLoading && !errorMessage ? <p>{agents.length} agents ready.</p> : null}
        </section>

        <section className="panel-section" aria-label="Backend agent list">
          <div className="panel-label-row">
            <h3>Roster</h3>
            <span className="panel-count">{agents.length}</span>
          </div>

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
