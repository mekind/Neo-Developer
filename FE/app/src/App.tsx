import { useMemo, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import {
  INTERACTION_RADIUS,
  createWorldCharacter,
  measureDistance,
  type CharacterArchetype,
  type WorldCharacter,
} from '@/game/characters'
import { WorldCanvas } from '@/game/WorldCanvas'

export default function App() {
  const [characters, setCharacters] = useState<WorldCharacter[]>([])
  const [lastInteractionMessage, setLastInteractionMessage] = useState<string | null>(null)

  const handleCreateCharacter = (name: string, archetype: CharacterArchetype) => {
    setCharacters((current) => [
      ...current,
      createWorldCharacter(name, archetype, current.length),
    ])
    setLastInteractionMessage(null)
  }

  const currentCharacter = useMemo(() => characters.at(-1) ?? null, [characters])
  const interactionTarget = useMemo(() => {
    if (!currentCharacter) return null

    return characters
      .filter((character) => character.id !== currentCharacter.id)
      .map((character) => ({ character, distance: measureDistance(currentCharacter, character) }))
      .filter(({ distance }) => distance <= INTERACTION_RADIUS)
      .sort((left, right) => left.distance - right.distance)[0]?.character ?? null
  }, [characters, currentCharacter])

  const playerStatusCopy = currentCharacter
    ? `Controlling ${currentCharacter.name} at (${currentCharacter.x}, ${currentCharacter.y}).`
    : 'Create a character to start moving through the world.'
  const interactionStatusCopy = interactionTarget
    ? `Press E near ${interactionTarget.name} to interact.`
    : currentCharacter
      ? 'Move closer to another generated character to interact.'
      : 'Add at least two characters to unlock interaction.'
  const phaserStatusCopy = currentCharacter
    ? 'Phaser drives the map camera, movement, and proximity interaction inside the world stage.'
    : 'Create a character to mount the Phaser world and spawn into the larger map.'

  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">demo-friendly baseline</p>
          <h1>편하게 둘러보는 데모 공간</h1>
        </div>
        <p className="topbar-copy">
          처음 보는 사람도 부담 없이 이해할 수 있도록, 따뜻한 중간 톤의 월드와 읽기 쉬운 안내 흐름으로
          데모 경험을 정리합니다.
        </p>
      </header>

      <div className="app-body">
        <aside className="sidebar panel-shell">
          <InteractionPanel characters={characters} onCreateCharacter={handleCreateCharacter} />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">World viewport</p>
            <p className="description">
              NeoD처럼 월드 영역을 독립적인 canvas/game surface로 다루기 위해, 이제 맵은 Phaser가 직접
              렌더링하고 React는 레이아웃과 보조 UI를 맡습니다.
            </p>
            <p className="description">Controls: WASD / Arrow keys to move · E to interact</p>
          </div>
          <WorldCanvas
            characters={characters}
            onCharactersChange={setCharacters}
            onInteractionMessage={setLastInteractionMessage}
            currentCharacter={currentCharacter}
            interactionTarget={interactionTarget}
            playerStatusCopy={playerStatusCopy}
            interactionStatusCopy={interactionStatusCopy}
            lastInteractionMessage={lastInteractionMessage}
            phaserStatusCopy={phaserStatusCopy}
          />
        </section>
      </div>
    </main>
  )
}
