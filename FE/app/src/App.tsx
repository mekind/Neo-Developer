import { useEffect, useMemo, useRef, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import {
  PLAYER_MOVE_STEP,
  INTERACTION_RADIUS,
  WORLD_HEIGHT,
  WORLD_PADDING,
  WORLD_WIDTH,
  clampToWorld,
  createWorldCharacter,
  measureDistance,
  type CharacterArchetype,
  type WorldCharacter,
} from '@/game/characters'
import { WorldCanvas } from '@/game/WorldCanvas'

type DirectionKey = 'up' | 'down' | 'left' | 'right'

const MOVEMENT_KEYS: Record<string, DirectionKey> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
}

export default function App() {
  const [characters, setCharacters] = useState<WorldCharacter[]>([])
  const [lastInteractionMessage, setLastInteractionMessage] = useState<string | null>(null)
  const pressedKeysRef = useRef<Set<DirectionKey>>(new Set())
  const movementIntervalRef = useRef<number | null>(null)
  const currentCharacterRef = useRef<WorldCharacter | null>(null)
  const interactionTargetRef = useRef<WorldCharacter | null>(null)

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

  useEffect(() => {
    currentCharacterRef.current = currentCharacter
    interactionTargetRef.current = interactionTarget
  }, [currentCharacter, interactionTarget])

  const moveCurrentCharacter = () => {
    const pressedKeys = pressedKeysRef.current
    if (pressedKeys.size === 0) return

    setCharacters((current) => {
      if (current.length === 0) return current

      const playerIndex = current.length - 1
      const player = current[playerIndex]
      let nextX = player.x
      let nextY = player.y

      if (pressedKeys.has('up')) nextY -= PLAYER_MOVE_STEP
      if (pressedKeys.has('down')) nextY += PLAYER_MOVE_STEP
      if (pressedKeys.has('left')) nextX -= PLAYER_MOVE_STEP
      if (pressedKeys.has('right')) nextX += PLAYER_MOVE_STEP

      const clampedCharacter: WorldCharacter = {
        ...player,
        x: clampToWorld(nextX, WORLD_PADDING, WORLD_WIDTH - WORLD_PADDING),
        y: clampToWorld(nextY, WORLD_PADDING + 72, WORLD_HEIGHT - WORLD_PADDING),
      }

      return current.map((character, index) => (index === playerIndex ? clampedCharacter : character))
    })
  }

  useEffect(() => {
    const pressedKeys = pressedKeysRef.current

    const stopMovementLoop = () => {
      if (movementIntervalRef.current !== null) {
        window.clearInterval(movementIntervalRef.current)
        movementIntervalRef.current = null
      }
    }

    const startMovementLoop = () => {
      if (movementIntervalRef.current !== null || pressedKeysRef.current.size === 0) return
      movementIntervalRef.current = window.setInterval(moveCurrentCharacter, 90)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const movementKey = MOVEMENT_KEYS[event.key]
      const activeCurrentCharacter = currentCharacterRef.current

      if (movementKey && activeCurrentCharacter) {
        event.preventDefault()

        if (!pressedKeys.has(movementKey)) {
          pressedKeys.add(movementKey)
          moveCurrentCharacter()
        }

        startMovementLoop()
        return
      }

      const activeInteractionTarget = interactionTargetRef.current

      if (event.key.toLowerCase() === 'e' && activeCurrentCharacter && activeInteractionTarget) {
        event.preventDefault()
        setLastInteractionMessage(`${activeCurrentCharacter.name} greeted ${activeInteractionTarget.name}.`)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const movementKey = MOVEMENT_KEYS[event.key]
      if (!movementKey) return

      pressedKeys.delete(movementKey)
      if (pressedKeys.size === 0) stopMovementLoop()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      stopMovementLoop()
      pressedKeys.clear()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const playerStatusCopy = currentCharacter
    ? `Controlling ${currentCharacter.name} at (${currentCharacter.x}, ${currentCharacter.y}).`
    : 'Create a character to start moving through the world.'
  const interactionStatusCopy = interactionTarget
    ? `Press E near ${interactionTarget.name} to interact.`
    : currentCharacter
      ? 'Move closer to another generated character to interact.'
      : 'Add at least two characters to unlock interaction.'

  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">FE bootstrap</p>
          <h1>Gather-like World Layout</h1>
        </div>
        <p className="topbar-copy">
          상단 바와 사이드바를 유지한 채, 본문 월드 영역에서 패널 기반 캐릭터 생성 플로우를 바로 검증합니다.
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
              Gather-like 레이아웃을 유지하면서, 생성된 캐릭터가 월드에 즉시 나타나는 첫 상호작용 루프를 보여줍니다.
            </p>
            <p className="description">Controls: WASD / Arrow keys to move · E to interact</p>
          </div>
          <WorldCanvas
            characters={characters}
            currentCharacter={currentCharacter}
            interactionTarget={interactionTarget}
            playerStatusCopy={playerStatusCopy}
            interactionStatusCopy={interactionStatusCopy}
            lastInteractionMessage={lastInteractionMessage}
          />
        </section>
      </div>
    </main>
  )
}
