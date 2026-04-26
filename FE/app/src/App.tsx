import { useEffect, useMemo, useRef, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import {
  PLAYER_MOVE_STEP,
  INTERACTION_RADIUS,
  WORLD_HEIGHT,
  WORLD_PADDING,
  WORLD_WIDTH,
  buildPlayerCharacter,
  buildWorldCharacter,
  clampToWorld,
  measureDistance,
  type WorldCharacter,
} from '@/game/characters'
import { WorldCanvas } from '@/game/WorldCanvas'
import { createAgent, listAgents } from '@/services/agents'

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
  const [playerCharacter, setPlayerCharacter] = useState<WorldCharacter>(() => buildPlayerCharacter())
  const [agents, setAgents] = useState<WorldCharacter[]>([])
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null)
  const [lastInteractionMessage, setLastInteractionMessage] = useState<string | null>(null)
  const pressedKeysRef = useRef<Set<DirectionKey>>(new Set())
  const movementIntervalRef = useRef<number | null>(null)
  const currentCharacterRef = useRef<WorldCharacter>(playerCharacter)
  const interactionTargetRef = useRef<WorldCharacter | null>(null)

  const handleCreateCharacter = async (personaSummary: string, backstoryPrompt: string) => {
    const createdAgent = await createAgent({ personaSummary, backstoryPrompt })

    setAgents((current) => [...current, buildWorldCharacter(createdAgent, current.length)])
    setLastInteractionMessage(null)
  }

  useEffect(() => {
    let isMounted = true

    async function loadAgents() {
      try {
        setAgentLoadError(null)
        const loadedAgents = await listAgents()
        if (!isMounted) return

        setAgents(loadedAgents.map((agent, index) => buildWorldCharacter(agent, index)))
      } catch (error) {
        if (!isMounted) return
        setAgentLoadError(error instanceof Error ? error.message : 'Failed to load agents.')
      }
    }

    void loadAgents()

    return () => {
      isMounted = false
    }
  }, [])

  const characters = useMemo(() => [playerCharacter, ...agents], [playerCharacter, agents])
  const currentCharacter = playerCharacter
  const interactionTarget = useMemo(() => {
    return agents
      .map((character) => ({ character, distance: measureDistance(currentCharacter, character) }))
      .filter(({ distance }) => distance <= INTERACTION_RADIUS)
      .sort((left, right) => left.distance - right.distance)[0]?.character ?? null
  }, [agents, currentCharacter])

  useEffect(() => {
    currentCharacterRef.current = currentCharacter
    interactionTargetRef.current = interactionTarget
  }, [currentCharacter, interactionTarget])

  const moveCurrentCharacter = () => {
    const pressedKeys = pressedKeysRef.current
    if (pressedKeys.size === 0) return

    setPlayerCharacter((player) => {
      let nextX = player.x
      let nextY = player.y

      if (pressedKeys.has('up')) nextY -= PLAYER_MOVE_STEP
      if (pressedKeys.has('down')) nextY += PLAYER_MOVE_STEP
      if (pressedKeys.has('left')) nextX -= PLAYER_MOVE_STEP
      if (pressedKeys.has('right')) nextX += PLAYER_MOVE_STEP

      return {
        ...player,
        x: clampToWorld(nextX, WORLD_PADDING, WORLD_WIDTH - WORLD_PADDING),
        y: clampToWorld(nextY, WORLD_PADDING + 72, WORLD_HEIGHT - WORLD_PADDING),
      }
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

  const playerStatusCopy = `Controlling ${currentCharacter.name} at (${currentCharacter.x}, ${currentCharacter.y}).`
  const interactionStatusCopy = interactionTarget
    ? `Press E near ${interactionTarget.name} to interact.`
    : agents.length > 0
      ? 'Move closer to an agent NPC to interact.'
      : 'Agent NPCs will appear here after the backend responds.'

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
          <InteractionPanel characters={agents} playerCharacter={playerCharacter} onCreateCharacter={handleCreateCharacter} />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">World viewport</p>
            <p className="description">
              사용자는 자기 아바타를 직접 움직이고, 백엔드 agent API에서 온 캐릭터들은 NPC로 월드에 배치됩니다.
            </p>
            <p className="description">Controls: WASD / Arrow keys to move · E to interact</p>
            {agentLoadError ? <p className="description" role="alert">{agentLoadError}</p> : null}
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
