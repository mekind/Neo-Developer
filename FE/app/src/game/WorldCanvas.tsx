import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'

import { buildWorldPlayer, INTERACTION_RADIUS_PERCENT, measurePercentDistance, type WorldAgent } from './agents'
import {
  moveWorldPosition,
  PLAYER_MOVEMENT_SPEED,
  resolvePlayerMovementStep,
  type MovementVector,
} from './playerMovement'

type WorldCanvasProps = {
  agents: WorldAgent[]
  onAgentInteraction: (agent: WorldAgent) => void
}

const MAP_WIDTH = 2400
const MAP_HEIGHT = 1350
const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 720
const PLAYER_RADIUS = 32
const AGENT_RADIUS = 28
const MINIMAP_X = 1040
const MINIMAP_Y = 24
const MINIMAP_WIDTH = 180
const MINIMAP_HEIGHT = 102
const MINIMAP_PADDING = 8
const CAMERA_LERP = 0.16
const SPEECH_MS = 1200
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

function unprojectX(x: number) {
  return (x / MAP_WIDTH) * 100
}

function unprojectY(y: number) {
  return (y / MAP_HEIGHT) * 100
}

function projectMiniMapPoint(xPercent: number, yPercent: number) {
  return {
    x: MINIMAP_X + MINIMAP_PADDING + (xPercent / 100) * (MINIMAP_WIDTH - MINIMAP_PADDING * 2),
    y: MINIMAP_Y + MINIMAP_PADDING + (yPercent / 100) * (MINIMAP_HEIGHT - MINIMAP_PADDING * 2),
  }
}

function getInputVector(cursors: Phaser.Types.Input.Keyboard.CursorKeys): MovementVector {
  return {
    x: Number(Boolean(cursors.right?.isDown)) - Number(Boolean(cursors.left?.isDown)),
    y: Number(Boolean(cursors.down?.isDown)) - Number(Boolean(cursors.up?.isDown)),
  }
}

function clampWorldPoint(x: number, y: number) {
  return {
    x: Math.min(MAP_WIDTH - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, x)),
    y: Math.min(MAP_HEIGHT - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, y)),
  }
}

function circleIntersectsRect(cx: number, cy: number, radius: number, rect: (typeof OBSTACLES)[number]) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width))
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height))
  return Math.hypot(cx - nearestX, cy - nearestY) < radius
}

function circlesOverlap(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
  return Math.hypot(ax - bx, ay - by) < ar + br
}

export function WorldCanvas({ agents, onAgentInteraction }: WorldCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const agentsRef = useRef<WorldAgent[]>(agents)
  const interactionCallbackRef = useRef(onAgentInteraction)

  agentsRef.current = agents
  interactionCallbackRef.current = onAgentInteraction

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
        private promptText!: Phaser.GameObjects.Text
        private agentSprites = new Map<string, { body: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text; speech: Phaser.GameObjects.Text }>()
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
        private spaceKey?: Phaser.Input.Keyboard.Key
        private playerState = {
          ...buildWorldPlayer(),
          velocity: { x: 0, y: 0 } as MovementVector,
        }
        private currentInteractionTarget: WorldAgent | null = null
        private speechByAgent = new Map<string, number>()

        create() {
          this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
          this.cameras.main.setBackgroundColor('#ece6da')

          this.background = this.add.graphics()
          this.obstacleLayer = this.add.graphics()
          this.minimapLayer = this.add.graphics().setScrollFactor(0)
          this.playerMarker = this.add.circle(projectX(this.playerState.xPercent), projectY(this.playerState.yPercent), PLAYER_RADIUS, 0x22c55e)
          this.playerMarker.setStrokeStyle(5, 0xfffbeb, 1)
          this.playerLabel = this.add.text(0, 0, this.playerState.label, {
            color: '#234035',
            fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
            fontSize: '14px',
            backgroundColor: 'rgba(255,247,237,0.92)',
            padding: { x: 8, y: 4 },
          })
          this.promptText = this.add.text(640, 664, '', {
            color: '#f8fafc',
            fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
            fontSize: '16px',
            backgroundColor: 'rgba(17,24,39,0.82)',
            padding: { x: 14, y: 8 },
          })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(20)
            .setVisible(false)

          this.drawBackground()
          this.drawObstacles()
          this.syncSprites(this.time.now)
          this.cameras.main.startFollow(this.playerMarker, true, CAMERA_LERP, CAMERA_LERP)

          this.cursors = this.input.keyboard?.createCursorKeys() ?? ({}) as Phaser.Types.Input.Keyboard.CursorKeys
          this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
          this.spaceKey?.on(Phaser.Input.Keyboard.Events.DOWN, () => {
            if (this.currentInteractionTarget) {
              this.speechByAgent.set(this.currentInteractionTarget.id, this.time.now + SPEECH_MS)
              interactionCallbackRef.current(this.currentInteractionTarget)
            }
          })

          this.scale.on('resize', this.handleResize, this)
          this.handleResize({ width: this.scale.width, height: this.scale.height })
        }

        update(time: number, delta: number) {
          const movement = resolvePlayerMovementStep(
            getInputVector(this.cursors),
            this.playerState.velocity,
            PLAYER_MOVEMENT_SPEED,
            delta,
          )
          this.playerState.velocity = movement.velocity

          const rawNext = moveWorldPosition(this.playerState, movement.velocity, delta)
          const attempted = clampWorldPoint(projectX(rawNext.xPercent), projectY(rawNext.yPercent))
          const current = { x: projectX(this.playerState.xPercent), y: projectY(this.playerState.yPercent) }
          const resolved = this.resolveCollision(current, attempted)
          this.playerState.xPercent = unprojectX(resolved.x)
          this.playerState.yPercent = unprojectY(resolved.y)

          this.syncSprites(time)
          this.syncInteractionUi()
          this.drawMinimap()
        }

        private resolveCollision(current: { x: number; y: number }, attempted: { x: number; y: number }) {
          const tryPoint = (candidate: { x: number; y: number }) => {
            if (OBSTACLES.some((rect) => circleIntersectsRect(candidate.x, candidate.y, PLAYER_RADIUS, rect))) return false
            if (
              agentsRef.current.some((agent) =>
                circlesOverlap(candidate.x, candidate.y, PLAYER_RADIUS, projectX(agent.xPercent), projectY(agent.yPercent), AGENT_RADIUS),
              )
            ) {
              return false
            }
            return true
          }

          if (tryPoint(attempted)) return attempted
          const xOnly = { x: attempted.x, y: current.y }
          if (tryPoint(xOnly)) return xOnly
          const yOnly = { x: current.x, y: attempted.y }
          if (tryPoint(yOnly)) return yOnly
          return current
        }

        private syncSprites(time: number) {
          const snapshot = agentsRef.current
          const ids = new Set(snapshot.map((agent) => agent.id))
          const playerX = projectX(this.playerState.xPercent)
          const playerY = projectY(this.playerState.yPercent)

          this.playerMarker.setPosition(playerX, playerY)
          this.playerLabel.setPosition(playerX - 30, playerY + 44).setText(this.playerState.label)

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

              const speech = this.add.text(x, y - 54, '안녕', {
                color: '#234035',
                fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
                fontSize: '14px',
                backgroundColor: 'rgba(255,255,255,0.94)',
                padding: { x: 10, y: 5 },
              })
                .setOrigin(0.5)
                .setVisible(false)

              this.agentSprites.set(agent.id, { body, label, speech })
              return
            }

            existing.body.setPosition(x, y)
            existing.body.setFillStyle(agent.usesPlaceholder ? 0xfde68a : 0x93c5fd)
            existing.label.setPosition(x - 40, y + 36).setText(agent.label)
            existing.speech.setPosition(x, y - 54)
            existing.speech.setVisible((this.speechByAgent.get(agent.id) ?? 0) > time)
          })

          for (const [id, sprite] of this.agentSprites.entries()) {
            if (ids.has(id)) continue
            sprite.body.destroy()
            sprite.label.destroy()
            sprite.speech.destroy()
            this.agentSprites.delete(id)
          }
        }

        private syncInteractionUi() {
          this.currentInteractionTarget =
            agentsRef.current
              .map((agent) => ({ agent, distance: measurePercentDistance(this.playerState, agent) }))
              .filter(({ distance }) => distance <= INTERACTION_RADIUS_PERCENT)
              .sort((left, right) => left.distance - right.distance)[0]?.agent ?? null

          if (this.currentInteractionTarget) {
            this.promptText.setText(`SPACE · Talk to ${this.currentInteractionTarget.label}`)
            this.promptText.setVisible(true)
          } else {
            this.promptText.setVisible(false)
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

          const playerPoint = projectMiniMapPoint(this.playerState.xPercent, this.playerState.yPercent)
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
          this.promptText.setPosition(gameSize.width / 2, Math.max(40, gameSize.height - 56))
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
