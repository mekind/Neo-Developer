import type { WorldAgent } from '@/game/agents'
import { WorldCanvas } from '@/game/WorldCanvas'

type MapSectionProps = {
  agents: WorldAgent[]
  isLoading: boolean
  errorMessage: string | null
}

export function MapSection({ agents, isLoading, errorMessage }: MapSectionProps) {
  return (
    <section className="world-stage panel-shell" aria-label="world stage">
      <div className="world-stage-copy">
        <p className="eyebrow">Room</p>
        <h2>Commons Floor</h2>
        <p className="description">NeoD처럼 Phaser가 월드 surface를 직접 렌더링하고 React는 외곽 UI를 맡습니다.</p>
      </div>
      <WorldCanvas agents={agents} isLoading={isLoading} errorMessage={errorMessage} />
    </section>
  )
}
