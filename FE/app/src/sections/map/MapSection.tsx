import type { WorldAgent } from '@/game/agents'
import type { LpcSpriteCatalog } from '@/game/lpcSprite'
import { WorldCanvas } from '@/game/WorldCanvas'

type MapSectionProps = {
  agents: WorldAgent[]
  lpcSpriteCatalog: LpcSpriteCatalog
  onAgentInteraction: (agent: WorldAgent) => void
  focusRequest: { agentId: string; requestId: number } | null
  ambientSpeechByAgentId: Record<string, { text: string; visibleUntil: number }>
}

export function MapSection({ agents, lpcSpriteCatalog, onAgentInteraction, focusRequest, ambientSpeechByAgentId }: MapSectionProps) {
  return (
    <section className="world-stage world-stage--game-only panel-shell" aria-label="world stage">
      <WorldCanvas agents={agents} lpcSpriteCatalog={lpcSpriteCatalog} onAgentInteraction={onAgentInteraction} focusRequest={focusRequest} ambientSpeechByAgentId={ambientSpeechByAgentId} />
    </section>
  )
}
