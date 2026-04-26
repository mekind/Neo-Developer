import type { WorldAgent } from '@/game/agents'
import { WorldCanvas } from '@/game/WorldCanvas'

type MapSectionProps = {
  agents: WorldAgent[]
  lastInteractionMessage: string | null
  onAgentInteraction: (agent: WorldAgent) => void
}

export function MapSection({ agents, lastInteractionMessage, onAgentInteraction }: MapSectionProps) {
  return (
    <section className="world-stage world-stage--game-only panel-shell" aria-label="world stage">
      <WorldCanvas agents={agents} lastInteractionMessage={lastInteractionMessage} onAgentInteraction={onAgentInteraction} />
    </section>
  )
}
