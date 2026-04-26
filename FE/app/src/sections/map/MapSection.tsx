import type { WorldAgent } from '@/game/agents'
import { WorldCanvas } from '@/game/WorldCanvas'

type MapSectionProps = {
  agents: WorldAgent[]
  onAgentInteraction: (agent: WorldAgent) => void
}

export function MapSection({ agents, onAgentInteraction }: MapSectionProps) {
  return (
    <section className="world-stage world-stage--game-only panel-shell" aria-label="world stage">
      <WorldCanvas agents={agents} onAgentInteraction={onAgentInteraction} />
    </section>
  )
}
