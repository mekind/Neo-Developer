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
    <section className="world-stage panel-shell" aria-label="월드 스테이지">
      <div className="world-stage-copy">
        <p className="eyebrow">공간</p>
        <h2>커먼즈 플로어</h2>
        <p className="description">NeoD처럼 상단 미니맵, 방향키 이동, 스페이스 상호작용을 갖춘 공유공간 데모입니다.</p>
      </div>
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
