import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'

import type { WorldAgent, WorldPlayer } from './agents'

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
const MINIMAP_X = 1040
const MINIMAP_Y = 24
const MINIMAP_WIDTH = 180
const MINIMAP_HEIGHT = 102
const MINIMAP_PADDING = 8
const CAMERA_LERP = 0.16
const OBSTACLES = [
  { x: 300, y: 350, width: 320, height: 140, color: 0xcfaf84 },
  { x: 980, y: 460, width: 360, height: 150, color: 0xd7b88c },
  { x: 1680, y: 320, width: 280, height: 140, color: 0xcfaf84 },
  { x: 620, y: 920, width: 540, height: 110, color: 0xd6b48b },
  { x: 1820, y: 860, width: 220, height: 220, color: 0x8ea275 },
] as const

function projectX(xPercent: number) {
  return (xPercent / 100) * MAP_WIDTH
}

function projectY(yPercent: number) {
  return (yPercent / 100) * MAP_HEIGHT
}

function projectMiniMapPoint(xPercent: number, yPercent: number) {
  return {
    x: MINIMAP_X + MINIMAP_PADDING + (xPercent / 100) * (MINIMAP_WIDTH - MINIMAP_PADDING * 2),
    y: MINIMAP_Y + MINIMAP_PADDING + (yPercent / 100) * (MINIMAP_HEIGHT - MINIMAP_PADDING * 2),
  }
}

export function WorldCanvas({ agents, player }: WorldCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const agentsRef = useRef<WorldAgent[]>(agents)
  const playerRef = useRef<WorldPlayer>(player)

  agentsRef.current = agents
  playerRef.current = player

  useEffect(() => {
    let cancelled = false

    async function mountGame() {
      if (!mountRef.current || gameRef.current) return

      const Phaser = (await import('phaser')).default
      if (cancelled || !mountRef.current) return

      class BackendRosterScene extends Phaser.Scene {
        private background!: Phaser.GameObjects.Graphics
        private obstacleLayer!: Phaser.GameObjects.Graphics
        private minimapLayer!: Phaser.GameObjects.Graphics
        private playerMarker!: Phaser.GameObjects.Arc
        private playerLabel!: Phaser.GameObjects.Text
        private agentSprites = new Map<string, { body: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text }>()

        create() {
          this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
          this.cameras.main.setBackgroundColor('#ece6da')

          this.background = this.add.graphics()
          this.obstacleLayer = this.add.graphics()
          this.minimapLayer = this.add.graphics().setScrollFactor(0)
          this.playerMarker = this.add.circle(projectX(playerRef.current.xPercent), projectY(playerRef.current.yPercent), AGENT_RADIUS + 4, 0x22c55e)
          this.playerMarker.setStrokeStyle(5, 0xfffbeb, 1)
          this.playerLabel = this.add.text(0, 0, playerRef.current.label, {
            color: '#234035',
            fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
            fontSize: '14px',
            backgroundColor: 'rgba(255,247,237,0.92)',
            padding: { x: 8, y: 4 },
          })

          this.drawBackground()
          this.drawObstacles()
          this.syncSprites()
          this.cameras.main.startFollow(this.playerMarker, true, CAMERA_LERP, CAMERA_LERP)

          this.scale.on('resize', this.handleResize, this)
          this.handleResize({ width: this.scale.width, height: this.scale.height })
        }

        update() {
          this.syncSprites()
          this.drawMinimap()
        }

        private syncSprites() {
          const snapshot = agentsRef.current
          const ids = new Set(snapshot.map((agent) => agent.id))
          const playerSnapshot = playerRef.current
          const playerX = projectX(playerSnapshot.xPercent)
          const playerY = projectY(playerSnapshot.yPercent)

          this.playerMarker.setPosition(playerX, playerY)
          this.playerLabel.setPosition(playerX - 30, playerY + 40).setText(playerSnapshot.label)

          snapshot.forEach((agent) => {
            const existing = this.agentSprites.get(agent.id)
            const x = projectX(agent.xPercent)
            const y = projectY(agent.yPercent)

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

        private drawMinimap() {
          const camera = this.cameras.main
          this.minimapLayer.clear()
          this.minimapLayer.fillStyle(0x161e18, 0.82)
          this.minimapLayer.fillRoundedRect(MINIMAP_X, MINIMAP_Y, MINIMAP_WIDTH, MINIMAP_HEIGHT, 16)
          this.minimapLayer.fillStyle(0xdcedef, 0.92)
          this.minimapLayer.fillRoundedRect(
            MINIMAP_X + MINIMAP_PADDING,
            MINIMAP_Y + MINIMAP_PADDING,
            MINIMAP_WIDTH - MINIMAP_PADDING * 2,
            MINIMAP_HEIGHT - MINIMAP_PADDING * 2,
            10,
          )
          this.minimapLayer.fillStyle(0xd0ae80, 1)
          this.minimapLayer.fillRect(
            MINIMAP_X + MINIMAP_PADDING,
            MINIMAP_Y + MINIMAP_PADDING + (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) * 0.58,
            MINIMAP_WIDTH - MINIMAP_PADDING * 2,
            (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) * 0.42,
          )

          agentsRef.current.forEach((agent) => {
            const point = projectMiniMapPoint(agent.xPercent, agent.yPercent)
            this.minimapLayer.fillStyle(agent.usesPlaceholder ? 0xfde68a : 0x93c5fd, 1)
            this.minimapLayer.fillCircle(point.x, point.y, 4)
          })

          const playerPoint = projectMiniMapPoint(playerRef.current.xPercent, playerRef.current.yPercent)
          this.minimapLayer.fillStyle(0x22c55e, 1)
          this.minimapLayer.fillCircle(playerPoint.x, playerPoint.y, 5)

          const viewportRect = {
            x: MINIMAP_X + MINIMAP_PADDING + (camera.worldView.x / MAP_WIDTH) * (MINIMAP_WIDTH - MINIMAP_PADDING * 2),
            y: MINIMAP_Y + MINIMAP_PADDING + (camera.worldView.y / MAP_HEIGHT) * (MINIMAP_HEIGHT - MINIMAP_PADDING * 2),
            width: (camera.worldView.width / MAP_WIDTH) * (MINIMAP_WIDTH - MINIMAP_PADDING * 2),
            height: (camera.worldView.height / MAP_HEIGHT) * (MINIMAP_HEIGHT - MINIMAP_PADDING * 2),
          }
          this.minimapLayer.lineStyle(2, 0xffffff, 0.92)
          this.minimapLayer.strokeRoundedRect(viewportRect.x, viewportRect.y, viewportRect.width, viewportRect.height, 8)
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

  return <div ref={mountRef} className="world-phaser-host" aria-label="Phaser map viewport" />
}
