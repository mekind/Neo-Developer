import type { WorldAgent } from '@/game/agents'
import type { LpcSpriteBundle } from '@/game/lpcSprite'
import { WorldCanvas } from '@/game/WorldCanvas'

type MapSectionProps = {
  agents: WorldAgent[]
  lpcSpriteBundle: LpcSpriteBundle | null
  onAgentInteraction: (agent: WorldAgent) => void
}

export function MapSection({ agents, lpcSpriteBundle, onAgentInteraction }: MapSectionProps) {
  return (
    <section className="world-stage world-stage--game-only panel-shell" aria-label="world stage">
      <WorldCanvas agents={agents} lpcSpriteBundle={lpcSpriteBundle} onAgentInteraction={onAgentInteraction} />
    </section>
  )
}
