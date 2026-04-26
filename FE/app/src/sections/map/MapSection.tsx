import type { WorldAgent, WorldPlayer } from '@/game/agents'
import { WorldCanvas } from '@/game/WorldCanvas'

type MapSectionProps = {
  agents: WorldAgent[]
  player: WorldPlayer
  isLoading: boolean
  errorMessage: string | null
  interactionTarget: WorldAgent | null
  lastInteractionMessage: string | null
}

export function MapSection({
  agents,
  player,
  isLoading,
  errorMessage,
  interactionTarget,
  lastInteractionMessage,
}: MapSectionProps) {
  return (
    <section className="world-stage world-stage--game-only panel-shell" aria-label="world stage">
      <WorldCanvas
        agents={agents}
        player={player}
        isLoading={isLoading}
        errorMessage={errorMessage}
        interactionTarget={interactionTarget}
        lastInteractionMessage={lastInteractionMessage}
      />
    </section>
  )
}
