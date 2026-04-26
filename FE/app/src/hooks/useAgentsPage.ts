import { useEffect, useMemo, useRef, useState } from 'react'

import {
  INTERACTION_RADIUS_PERCENT,
  createLocalWorldAgent,
  buildWorldAgents,
  buildWorldPlayer,
  measurePercentDistance,
  type WorldAgent,
  type WorldPlayer,
} from '@/game/agents'
import {
  type MovementVector,
  moveWorldPosition,
  PLAYER_MOVEMENT_SPEED,
  resolvePlayerMovementStep,
} from '@/game/playerMovement'
import { listAgents } from '@/services/agents'

type DirectionKey = 'up' | 'down' | 'left' | 'right'

const MOVEMENT_KEYS: Record<string, DirectionKey> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

function getInputVector(pressedKeys: Set<DirectionKey>): MovementVector {
  return {
    x: Number(pressedKeys.has('right')) - Number(pressedKeys.has('left')),
    y: Number(pressedKeys.has('down')) - Number(pressedKeys.has('up')),
  }
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
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number | null>(null)
  const velocityRef = useRef<MovementVector>({ x: 0, y: 0 })
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

  useEffect(() => {
    const pressedKeys = pressedKeysRef.current

    const stopMovementLoop = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      lastFrameTimeRef.current = null
    }

    const stepMovement = (time: number) => {
      const previousTime = lastFrameTimeRef.current ?? time
      const deltaMs = time - previousTime
      lastFrameTimeRef.current = time

      const movement = resolvePlayerMovementStep(
        getInputVector(pressedKeysRef.current),
        velocityRef.current,
        PLAYER_MOVEMENT_SPEED,
        deltaMs,
      )
      velocityRef.current = movement.velocity

      if (movement.isMoving) {
        setPlayer((currentPlayer) => ({
          ...currentPlayer,
          ...moveWorldPosition(currentPlayer, movement.velocity, deltaMs),
        }))
        animationFrameRef.current = window.requestAnimationFrame(stepMovement)
      } else {
        stopMovementLoop()
      }
    }

    const ensureMovementLoop = () => {
      if (animationFrameRef.current !== null) return
      animationFrameRef.current = window.requestAnimationFrame(stepMovement)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const movementKey = MOVEMENT_KEYS[event.key]

      if (movementKey) {
        event.preventDefault()
        pressedKeys.add(movementKey)
        ensureMovementLoop()
        return
      }

      if (event.code === 'Space' && interactionTargetRef.current) {
        event.preventDefault()
        setLastInteractionMessage(`${playerRef.current.label} greeted ${interactionTargetRef.current.label}.`)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const movementKey = MOVEMENT_KEYS[event.key]
      if (!movementKey) return
      pressedKeys.delete(movementKey)
      ensureMovementLoop()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      stopMovementLoop()
      pressedKeys.clear()
      velocityRef.current = { x: 0, y: 0 }
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

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
