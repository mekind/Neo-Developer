import { useEffect, useMemo, useRef, useState } from 'react'

import {
  INTERACTION_RADIUS_PERCENT,
  PLAYER_STEP_PERCENT,
  createLocalWorldAgent,
  buildWorldAgents,
  buildWorldPlayer,
  clampPercent,
  measurePercentDistance,
  type WorldAgent,
  type WorldPlayer,
} from '@/game/agents'
import { listAgents } from '@/services/agents'

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

export function useAgentsPage() {
  const [backendAgents, setBackendAgents] = useState<WorldAgent[]>([])
  const [createdAgents, setCreatedAgents] = useState<WorldAgent[]>([])
  const [player, setPlayer] = useState<WorldPlayer>(() => buildWorldPlayer())
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastInteractionMessage, setLastInteractionMessage] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const agents = useMemo(() => [...backendAgents, ...createdAgents], [backendAgents, createdAgents])

  const pressedKeysRef = useRef<Set<DirectionKey>>(new Set())
  const movementIntervalRef = useRef<number | null>(null)
  const playerRef = useRef<WorldPlayer>(player)
  const interactionTargetRef = useRef<WorldAgent | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadAgents() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const nextAgents = await listAgents()
        if (isMounted) {
          setBackendAgents(buildWorldAgents(nextAgents))
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load backend agents.')
          setBackendAgents([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAgents()

    return () => {
      isMounted = false
    }
  }, [])

  const interactionTarget = useMemo(() => {
    return agents
      .map((agent) => ({ agent, distance: measurePercentDistance(player, agent) }))
      .filter(({ distance }) => distance <= INTERACTION_RADIUS_PERCENT)
      .sort((left, right) => left.distance - right.distance)[0]?.agent ?? null
  }, [agents, player])

  useEffect(() => {
    playerRef.current = player
    interactionTargetRef.current = interactionTarget
  }, [player, interactionTarget])

  const movePlayer = () => {
    const pressedKeys = pressedKeysRef.current
    if (pressedKeys.size === 0) return

    setPlayer((currentPlayer) => {
      let nextX = currentPlayer.xPercent
      let nextY = currentPlayer.yPercent

      if (pressedKeys.has('up')) nextY -= PLAYER_STEP_PERCENT
      if (pressedKeys.has('down')) nextY += PLAYER_STEP_PERCENT
      if (pressedKeys.has('left')) nextX -= PLAYER_STEP_PERCENT
      if (pressedKeys.has('right')) nextX += PLAYER_STEP_PERCENT

      return {
        ...currentPlayer,
        xPercent: clampPercent(nextX, 8, 92),
        yPercent: clampPercent(nextY, 18, 78),
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
      movementIntervalRef.current = window.setInterval(movePlayer, 90)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const movementKey = MOVEMENT_KEYS[event.key]

      if (movementKey) {
        event.preventDefault()

        if (!pressedKeys.has(movementKey)) {
          pressedKeys.add(movementKey)
          movePlayer()
        }

        startMovementLoop()
        return
      }

      if (event.key.toLowerCase() === 'e' && interactionTargetRef.current) {
        event.preventDefault()
        setLastInteractionMessage(`${playerRef.current.label} greeted ${interactionTargetRef.current.label}.`)
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
  }, [interactionTarget])

  const handleCreateAgent = async (name: string, persona: string) => {
    const created = {
      id: `local-agent-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      name,
      personaSummary: persona,
      createdAt: new Date().toISOString(),
    }

    setCreatedAgents((current) => [
      ...current,
      createLocalWorldAgent([...backendAgents, ...current], created),
    ])
  }

  return {
    agents,
    player,
    isLoading,
    errorMessage,
    interactionTarget,
    lastInteractionMessage,
    isDialogOpen,
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
    handleCreateAgent,
  }
}
