import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'

import { measurePercentDistance, type WorldAgent, type WorldPlayer } from './agents'

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
const PLAYER_RADIUS = 30
const MINIMAP_PADDING = 16
const MINIMAP_MIN_WIDTH = 160
const MINIMAP_MAX_WIDTH = 240
const MINIMAP_WIDTH_RATIO = 0.24
const MAIN_CAMERA_ZOOM = 1.15
const OBSTACLES = [
  { x: 300, y: 350, width: 320, height: 140, color: 0xcfaf84 },
  { x: 980, y: 460, width: 360, height: 150, color: 0xd7b88c },
  { x: 1680, y: 320, width: 280, height: 140, color: 0xcfaf84 },
  { x: 620, y: 920, width: 540, height: 110, color: 0xd6b48b },
  { x: 1820, y: 860, width: 220, height: 220, color: 0x8ea275 },
] as const

function toWorldX(percent: number) {
  return (percent / 100) * MAP_WIDTH
}

function toWorldY(percent: number) {
  return (percent / 100) * MAP_HEIGHT
}

function getMinimapViewport(gameWidth: number) {
  const width = Math.min(MINIMAP_MAX_WIDTH, Math.max(MINIMAP_MIN_WIDTH, Math.floor(gameWidth * MINIMAP_WIDTH_RATIO)))
  const height = Math.max(96, Math.floor((width * MAP_HEIGHT) / MAP_WIDTH))

  return {
    width,
    height,
    x: Math.max(MINIMAP_PADDING, gameWidth - width - MINIMAP_PADDING),
    y: MINIMAP_PADDING,
  }
}

export function WorldCanvas({
  agents,
  player,
  isLoading,
  errorMessage,
  interactionTarget,
  lastInteractionMessage,
}: WorldCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const agentsRef = useRef<WorldAgent[]>(agents)
  const playerRef = useRef<WorldPlayer>(player)
  const interactionTargetRef = useRef<WorldAgent | null>(interactionTarget)

  agentsRef.current = agents
  playerRef.current = player
  interactionTargetRef.current = interactionTarget

  useEffect(() => {
    let cancelled = false

    async function mountGame() {
      if (!mountRef.current || gameRef.current) return

      const Phaser = (await import('phaser')).default
      if (cancelled || !mountRef.current) return

      class BackendRosterScene extends Phaser.Scene {
        private background!: Phaser.GameObjects.Graphics
        private obstacleLayer!: Phaser.GameObjects.Graphics
        private playerBody!: Phaser.GameObjects.Arc
        private playerRing!: Phaser.GameObjects.Arc
        private playerLabel!: Phaser.GameObjects.Text
        private mainCamera!: Phaser.Cameras.Scene2D.Camera
        private minimapCamera!: Phaser.Cameras.Scene2D.Camera
        private agentSprites = new Map<string, { body: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text }>()

        create() {
          this.mainCamera = this.cameras.main
          this.mainCamera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
          this.mainCamera.setBackgroundColor('#ece6da')
          this.mainCamera.setZoom(MAIN_CAMERA_ZOOM)
          this.mainCamera.roundPixels = true

          this.background = this.add.graphics()
          this.obstacleLayer = this.add.graphics()
          this.drawBackground()
          this.drawObstacles()

          this.minimapCamera = this.cameras.add(0, 0, 10, 10)
          this.minimapCamera.setBackgroundColor('#f8efe0')
          this.minimapCamera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
          this.minimapCamera.roundPixels = true

          this.createPlayer()
          this.minimapCamera.ignore([this.playerLabel, this.playerRing])
          this.syncPlayer()
          this.syncAgents()

          this.mainCamera.startFollow(this.playerBody, true, 0.12, 0.12)
          this.mainCamera.setDeadzone(180, 120)

          this.scale.on('resize', this.handleResize, this)
          this.handleResize({ width: this.scale.width, height: this.scale.height })
        }

        update() {
          this.syncPlayer()
          this.syncAgents()
        }

        private createPlayer() {
          const x = toWorldX(playerRef.current.xPercent)
          const y = toWorldY(playerRef.current.yPercent)

          this.playerRing = this.add.circle(x, y, PLAYER_RADIUS * 2.6, 0x22c55e, 0.12)
          this.playerRing.setStrokeStyle(3, 0x22c55e, 0.28)

          this.playerBody = this.add.circle(x, y, PLAYER_RADIUS, 0x22c55e)
          this.playerBody.setStrokeStyle(5, 0xf7f7f2, 1)

          this.playerLabel = this.add.text(x - 26, y + 44, playerRef.current.label, {
            color: '#1f3b25',
            fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
            fontSize: '15px',
            backgroundColor: 'rgba(245,255,247,0.92)',
            padding: { x: 8, y: 4 },
          })
        }

        private syncPlayer() {
          const x = toWorldX(playerRef.current.xPercent)
          const y = toWorldY(playerRef.current.yPercent)

          this.playerRing.setPosition(x, y)
          this.playerBody.setPosition(x, y)
          this.playerLabel.setPosition(x - 26, y + 44).setText(playerRef.current.label)
        }

        private syncAgents() {
          const snapshot = agentsRef.current
          const ids = new Set(snapshot.map((agent) => agent.id))

          snapshot.forEach((agent) => {
            const existing = this.agentSprites.get(agent.id)
            const x = toWorldX(agent.xPercent)
            const y = toWorldY(agent.yPercent)
            const isInteractionTarget = agent.id === interactionTargetRef.current?.id
            const fillColor = isInteractionTarget ? 0xf59e0b : agent.usesPlaceholder ? 0xfde68a : 0x93c5fd

            if (!existing) {
              const body = this.add.circle(x, y, AGENT_RADIUS, fillColor)
              body.setStrokeStyle(4, 0xfffbeb, 1)

              const label = this.add.text(x - 40, y + 36, agent.label, {
                color: '#4d463f',
                fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
                fontSize: '14px',
                backgroundColor: 'rgba(255,247,237,0.88)',
                padding: { x: 8, y: 4 },
              })

              this.agentSprites.set(agent.id, { body, label })
              this.minimapCamera.ignore(label)
              return
            }

            existing.body.setPosition(x, y)
            existing.body.setFillStyle(fillColor)
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
          this.mainCamera.setViewport(0, 0, gameSize.width, gameSize.height)

          const minimapViewport = getMinimapViewport(gameSize.width)
          this.minimapCamera.setViewport(
            minimapViewport.x,
            minimapViewport.y,
            minimapViewport.width,
            minimapViewport.height,
          )
          this.minimapCamera.setZoom(
            Math.min(minimapViewport.width / MAP_WIDTH, minimapViewport.height / MAP_HEIGHT),
          )
          this.minimapCamera.centerOn(MAP_WIDTH / 2, MAP_HEIGHT / 2)
          this.minimapCamera.setRoundPixels(true)
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
                  ? 'Main camera follows the player. Minimap shows the full room.'
                  : 'No backend agents returned.'}
        </p>
      </div>

      <div className="world-canvas-shell">
        <div ref={mountRef} className="world-phaser-host" aria-label="Phaser map viewport" />
        <div className="world-canvas-hud" aria-hidden="true">
          <span className="world-minimap-badge">Minimap</span>
        </div>
      </div>

      <div className="world-feedback" aria-live="polite">
        <p>{lastInteractionMessage ?? 'No interaction triggered yet.'}</p>
        {distanceToTarget !== null ? <p>Distance to {interactionTarget?.label}: {distanceToTarget.toFixed(1)}%</p> : null}
      </div>
    </div>
  )
}
