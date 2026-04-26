import { useEffect, useMemo, useRef, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import {
  INTERACTION_RADIUS,
  PLAYER_MOVE_STEP,
  WORLD_HEIGHT,
  WORLD_PADDING,
  WORLD_WIDTH,
  buildPendingWorldCharacter,
  buildWorldCharacterFromAgent,
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

function buildPendingId() {
  return `pending-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

export default function App() {
  const [characters, setCharacters] = useState<WorldCharacter[]>([])
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const [createAgentError, setCreateAgentError] = useState<string | null>(null)
  const [lastInteractionMessage, setLastInteractionMessage] = useState<string | null>(null)
  const pressedKeysRef = useRef<Set<DirectionKey>>(new Set())
  const movementIntervalRef = useRef<number | null>(null)

  const handleCreateCharacter = async (personaSummary: string, backstoryPrompt: string) => {
    const pendingId = buildPendingId()

    setCreateAgentError(null)
    setIsCreatingAgent(true)
    setLastInteractionMessage(null)
    setCharacters((current) => [
      ...current,
      buildPendingWorldCharacter(personaSummary, backstoryPrompt, pendingId, current.length),
    ])

    try {
      const createdAgent = await createAgent({ personaSummary, backstoryPrompt })

      setCharacters((current) => {
        const pendingIndex = current.findIndex((character) => character.id === pendingId)
        if (pendingIndex === -1) return current

        const nextCharacters = [...current]
        nextCharacters[pendingIndex] = buildWorldCharacterFromAgent(createdAgent, pendingIndex)
        return nextCharacters
      })
    } catch (error) {
      setCharacters((current) => current.filter((character) => character.id !== pendingId))
      setCreateAgentError(error instanceof Error ? error.message : 'Failed to create agent.')
    } finally {
      setIsCreatingAgent(false)
    }
  }

  const currentCharacter = useMemo(() => characters.at(-1) ?? null, [characters])
  const interactionTarget = useMemo(() => {
    if (!currentCharacter || currentCharacter.status !== 'ready') return null

    return characters
      .filter((character) => character.id !== currentCharacter.id && character.status === 'ready')
      .map((character) => ({ character, distance: measureDistance(currentCharacter, character) }))
      .filter(({ distance }) => distance <= INTERACTION_RADIUS)
      .sort((left, right) => left.distance - right.distance)[0]?.character ?? null
  }, [characters, currentCharacter])

  const moveCurrentCharacter = () => {
    const pressedKeys = pressedKeysRef.current
    if (pressedKeys.size === 0) return

    setCharacters((current) => {
      if (current.length === 0) return current

      const playerIndex = current.length - 1
      const player = current[playerIndex]
      if (player.status !== 'ready') return current

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
      if (movementKey && currentCharacter?.status === 'ready') {
        event.preventDefault()

        if (!pressedKeys.has(movementKey)) {
          pressedKeys.add(movementKey)
          moveCurrentCharacter()
        }

        startMovementLoop()
        return
      }

      if (event.key.toLowerCase() === 'e' && currentCharacter?.status === 'ready' && interactionTarget) {
        event.preventDefault()
        setLastInteractionMessage(`${currentCharacter.name} greeted ${interactionTarget.name}.`)
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
  }, [currentCharacter, interactionTarget])

  const playerStatusCopy = currentCharacter
    ? currentCharacter.status === 'pending'
      ? `${currentCharacter.name} is pending while backend image generation completes.`
      : `Controlling ${currentCharacter.name} at (${currentCharacter.x}, ${currentCharacter.y}).`
    : 'Create a character to start moving through the world.'

  const interactionStatusCopy = interactionTarget
    ? `Press E near ${interactionTarget.name} to interact.`
    : currentCharacter?.status === 'ready'
      ? 'Move closer to another generated character to interact.'
      : 'Wait for backend completion before movement and interaction unlock.'

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
          <InteractionPanel
            characters={characters}
            onCreateCharacter={handleCreateCharacter}
            isCreatingAgent={isCreatingAgent}
            createAgentError={createAgentError}
          />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">World viewport</p>
            <p className="description">
              생성 요청 중인 에이전트는 메인 화면에 대기 상태로 나타나고, 이미지 생성까지 완료되면 월드의 정식
              멤버로 반영됩니다.
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
