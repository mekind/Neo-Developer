import { useEffect, useMemo, useRef, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import {
  PLAYER_MOVE_STEP,
  INTERACTION_RADIUS,
  WORLD_HEIGHT,
  WORLD_PADDING,
  WORLD_WIDTH,
  buildWorldCharacter,
  clampToWorld,
  measureDistance,
  type WorldCharacter,
} from '@/game/characters'
import { WorldCanvas } from '@/game/WorldCanvas'
import { createAgent } from '@/services/agents'

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

  const handleCreateCharacter = async (personaSummary: string, backstoryPrompt: string) => {
    const createdAgent = await createAgent({ personaSummary, backstoryPrompt })
    setCharacters((current) => [...current, buildWorldCharacter(createdAgent, current.length)])
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
    ? `${currentCharacter.name} · ${currentCharacter.x}, ${currentCharacter.y}`
    : 'Add an agent to begin.'
  const interactionStatusCopy = interactionTarget
    ? `Press E near ${interactionTarget.name}`
    : currentCharacter
      ? 'Move near another agent'
      : 'Add two agents'

  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">Neo Commons</p>
          <h1>스쿨 커먼즈</h1>
        </div>
        <div className="topbar-summary" aria-label="Room summary">
          <span className="status-pill">Live</span>
          <strong>{characters.length}</strong>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar panel-shell">
          <InteractionPanel characters={characters} onCreateCharacter={handleCreateCharacter} />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">Room</p>
            <h2>Commons Floor</h2>
            <p className="stage-meta">WASD / 방향키 · E</p>
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
