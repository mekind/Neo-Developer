import { useEffect, useRef } from 'react'

import { INTERACTION_RADIUS_PERCENT, measurePercentDistance, type WorldAgent, type WorldPlayer } from './agents'

type WorldCanvasProps = {
  agents: WorldAgent[]
  player: WorldPlayer
  isLoading: boolean
  errorMessage: string | null
  interactionTarget: WorldAgent | null
  lastInteractionMessage: string | null
}

const MAP_WIDTH = 2400
const MAP_HEIGHT = 1350
const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 720
const AGENT_RADIUS = 28

type DestroyableGame = {
  destroy: (removeCanvas?: boolean, noReturn?: boolean) => void
}

type PhaserLike = {
  AUTO: number
  Scale: {
    RESIZE: number
    CENTER_BOTH: number
  }
  Game: new (config: Record<string, unknown>) => DestroyableGame
  Scene: new (...args: never[]) => {
    cameras: {
      main: {
        setBounds: (...args: number[]) => void
        centerOn: (...args: number[]) => void
        setBackgroundColor: (color: string) => void
        setViewport: (...args: number[]) => void
      }
    }
    add: {
      graphics: () => {
        clear: () => void
        fillStyle: (color: number, alpha?: number) => void
        fillRect: (...args: number[]) => void
        fillRoundedRect: (...args: number[]) => void
        lineStyle: (width: number, color: number, alpha?: number) => void
        strokeRoundedRect: (...args: number[]) => void
        fillCircle: (...args: number[]) => void
      }
      circle: (x: number, y: number, radius: number, color: number) => {
        setStrokeStyle: (width: number, color: number, alpha?: number) => void
        setPosition: (x: number, y: number) => void
        setFillStyle: (color: number) => void
        destroy: () => void
      }
      text: (x: number, y: number, text: string, style: Record<string, unknown>) => {
        setPosition: (x: number, y: number) => { setText: (text: string) => void }
        destroy: () => void
      }
    }
    scale: {
      width: number
      height: number
      on: (event: string, handler: (gameSize: { width: number; height: number }) => void, context: unknown) => void
    }
  }
}

type AgentSprite = {
  body: {
    setPosition: (x: number, y: number) => void
    setFillStyle: (color: number) => void
    destroy: () => void
  }
  label: {
    setPosition: (x: number, y: number) => { setText: (text: string) => void }
    destroy: () => void
  }
}

const OBSTACLES = [
  { x: 300, y: 350, width: 320, height: 140, color: 0xcfaf84 },
  { x: 980, y: 460, width: 360, height: 150, color: 0xd7b88c },
  { x: 1680, y: 320, width: 280, height: 140, color: 0xcfaf84 },
  { x: 620, y: 920, width: 540, height: 110, color: 0xd6b48b },
  { x: 1820, y: 860, width: 220, height: 220, color: 0x8ea275 },
] as const

export function WorldCanvas({
  agents,
  player,
  isLoading,
  errorMessage,
  interactionTarget,
  lastInteractionMessage,
}: WorldCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<DestroyableGame | null>(null)
  const agentsRef = useRef<WorldAgent[]>(agents)

  agentsRef.current = agents

  useEffect(() => {
    let cancelled = false

    async function mountGame() {
      if (!mountRef.current || gameRef.current) return

      const Phaser = (await import('phaser')).default as unknown as PhaserLike
      if (cancelled || !mountRef.current) return

      class BackendRosterScene extends Phaser.Scene {
        private background!: ReturnType<InstanceType<PhaserLike['Scene']>['add']['graphics']>
        private obstacleLayer!: ReturnType<InstanceType<PhaserLike['Scene']>['add']['graphics']>
        private agentSprites = new Map<string, AgentSprite>()

        create() {
          this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
          this.cameras.main.centerOn(MAP_WIDTH / 2, MAP_HEIGHT / 2)
          this.cameras.main.setBackgroundColor('#ece6da')

          this.background = this.add.graphics()
          this.obstacleLayer = this.add.graphics()
          this.drawBackground()
          this.drawObstacles()
          this.syncAgents()

          this.scale.on('resize', this.handleResize, this)
          this.handleResize({ width: this.scale.width, height: this.scale.height })
        }

        update() {
          this.syncAgents()
        }

        private syncAgents() {
          const snapshot = agentsRef.current
          const ids = new Set(snapshot.map((agent) => agent.id))

          snapshot.forEach((agent) => {
            const existing = this.agentSprites.get(agent.id)
            const x = (agent.xPercent / 100) * MAP_WIDTH
            const y = (agent.yPercent / 100) * MAP_HEIGHT

            if (!existing) {
              const body = this.add.circle(x, y, AGENT_RADIUS, agent.usesPlaceholder ? 0xfde68a : 0x93c5fd)
              body.setStrokeStyle(4, 0xfffbeb, 1)

              const label = this.add.text(x - 40, y + 36, agent.label, {
                color: '#4d463f',
                fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
                fontSize: '14px',
                backgroundColor: 'rgba(255,247,237,0.88)',
                padding: { x: 8, y: 4 },
              })

              this.agentSprites.set(agent.id, { body, label })
              return
            }

            existing.body.setPosition(x, y)
            existing.body.setFillStyle(agent.usesPlaceholder ? 0xfde68a : 0x93c5fd)
            existing.label.setPosition(x - 40, y + 36).setText(agent.label)
          })

          for (const [id, sprite] of this.agentSprites.entries()) {
            if (ids.has(id)) continue
            sprite.body.destroy()
            sprite.label.destroy()
            this.agentSprites.delete(id)
          }
        }

        private drawBackground() {
          this.background.clear()
          this.background.fillStyle(0xf7efe3, 1)
          this.background.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)
          this.background.fillStyle(0xe4d2bc, 1)
          this.background.fillRect(0, MAP_HEIGHT - 220, MAP_WIDTH, 220)
          this.background.fillStyle(0x9b7959, 1)
          this.background.fillRect(80, 88, MAP_WIDTH - 160, 28)

          for (let x = 0; x < MAP_WIDTH; x += 120) {
            this.background.fillStyle(x % 240 === 0 ? 0xc8a883 : 0xd8baa0, 0.2)
            this.background.fillRect(x, 0, 6, MAP_HEIGHT)
          }

          const windowXs = [180, 520, 860, 1200, 1540, 1880]
          windowXs.forEach((x) => {
            this.background.fillStyle(0xa47b59, 1)
            this.background.fillRect(x, 130, 180, 180)
            this.background.fillStyle(0xdcedef, 1)
            this.background.fillRect(x + 14, 144, 152, 152)
          })

          this.background.fillStyle(0x78916d, 1)
          this.background.fillRect(2130, 160, 42, 160)
          this.background.fillCircle(2150, 130, 56)
        }

        private drawObstacles() {
          this.obstacleLayer.clear()
          OBSTACLES.forEach((obstacle) => {
            this.obstacleLayer.fillStyle(obstacle.color, 1)
            this.obstacleLayer.fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 20)
            this.obstacleLayer.lineStyle(3, 0x8c6d52, 0.7)
            this.obstacleLayer.strokeRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 20)
          })
        }

        private handleResize(gameSize: { width: number; height: number }) {
          this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height)
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current,
        backgroundColor: '#ece6da',
        scale: {
          mode: Phaser.Scale.RESIZE,
          parent: mountRef.current,
          width: VIEWPORT_WIDTH,
          height: VIEWPORT_HEIGHT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [BackendRosterScene],
      })
    }

    void mountGame()

    return () => {
      cancelled = true
      gameRef.current?.destroy(true, false)
      gameRef.current = null
    }
  }, [])

  const distanceToTarget = interactionTarget ? measurePercentDistance(player, interactionTarget) : null

  return (
    <div className="world-surface">
      <div className="world-status">
        <div>
          <p className="eyebrow">Room</p>
          <h2>Agents: {agents.length}</h2>
          <p className="world-helper world-helper-strong">
            Controlling {player.label} at ({player.xPercent.toFixed(0)}%, {player.yPercent.toFixed(0)}%).
          </p>
        </div>
        <p className="world-helper">
          {isLoading
            ? 'Loading backend roster.'
            : errorMessage
              ? 'Backend roster unavailable.'
              : interactionTarget
                ? `Press E near ${interactionTarget.label} to interact.`
                : agents.length > 0
                  ? 'Phaser-mounted once per load.'
                  : 'No backend agents returned.'}
        </p>
      </div>

      <div className="world-canvas-shell">
        <div ref={mountRef} className="world-phaser-host" aria-label="Phaser map viewport" />
        <div className="world-agent-layer" aria-hidden="true">
          <figure className="world-agent world-player" style={{ left: `${player.xPercent}%`, top: `${player.yPercent}%` }}>
            <div
              className="world-agent-ring"
              style={{ width: `${INTERACTION_RADIUS_PERCENT * 2}%`, height: `${INTERACTION_RADIUS_PERCENT * 2}%` }}
            />
            <img src={player.imageSrc} alt={`${player.label} avatar`} className="world-agent-avatar" />
            <figcaption>{player.label}</figcaption>
          </figure>

          {!isLoading && !errorMessage && agents.length > 0
            ? agents.map((agent) => (
                <figure
                  key={agent.id}
                  className={`world-agent${interactionTarget?.id === agent.id ? ' world-agent-target' : ''}`}
                  style={{ left: `${agent.xPercent}%`, top: `${agent.yPercent}%` }}
                >
                  <img src={agent.imageSrc} alt={`${agent.label} avatar`} className="world-agent-avatar" />
                  <figcaption>{agent.label}</figcaption>
                </figure>
              ))
            : null}
        </div>
      </div>

      <div className="world-feedback" aria-live="polite">
        <p>{lastInteractionMessage ?? 'No interaction triggered yet.'}</p>
        {distanceToTarget !== null ? <p>Distance to {interactionTarget?.label}: {distanceToTarget.toFixed(1)}%</p> : null}
      </div>
    </div>
  )
}
