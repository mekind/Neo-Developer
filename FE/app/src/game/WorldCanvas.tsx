import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'

import { type WorldAgent } from './agents'

export type CurrentUser = {
  id: string
  label: string
  x: number
  y: number
}

type WorldCanvasProps = {
  agents: WorldAgent[]
  currentUser: CurrentUser
  onCurrentUserChange: (nextUser: CurrentUser) => void
  isLoading: boolean
  errorMessage: string | null
}

const MAP_WIDTH = 2400
const MAP_HEIGHT = 1350
const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 720
const AGENT_RADIUS = 28
const PLAYER_RADIUS = 30
const PLAYER_SPEED = 240
const OBSTACLES = [
  { x: 300, y: 350, width: 320, height: 140, color: 0xcfaf84 },
  { x: 980, y: 460, width: 360, height: 150, color: 0xd7b88c },
  { x: 1680, y: 320, width: 280, height: 140, color: 0xcfaf84 },
  { x: 620, y: 920, width: 540, height: 110, color: 0xd6b48b },
  { x: 1820, y: 860, width: 220, height: 220, color: 0x8ea275 },
] as const

export function WorldCanvas({ agents, currentUser, onCurrentUserChange, isLoading, errorMessage }: WorldCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const agentsRef = useRef<WorldAgent[]>(agents)
  const currentUserRef = useRef<CurrentUser>(currentUser)

  agentsRef.current = agents
  currentUserRef.current = currentUser

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
        private playerLabel!: Phaser.GameObjects.Text
        private keys!: Phaser.Types.Input.Keyboard.CursorKeys
        private wasdKeys!: {
          up: Phaser.Input.Keyboard.Key
          down: Phaser.Input.Keyboard.Key
          left: Phaser.Input.Keyboard.Key
          right: Phaser.Input.Keyboard.Key
        }
        private agentSprites = new Map<string, { body: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text }>()

        create() {
          this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
          this.cameras.main.centerOn(currentUserRef.current.x, currentUserRef.current.y)
          this.cameras.main.setBackgroundColor('#ece6da')

          this.background = this.add.graphics()
          this.obstacleLayer = this.add.graphics()
          this.drawBackground()
          this.drawObstacles()
          this.createCurrentUser()
          this.syncAgents()

          this.keys = this.input.keyboard!.createCursorKeys()
          this.wasdKeys = this.input.keyboard!.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
          }) as BackendRosterScene['wasdKeys']

          this.scale.on('resize', this.handleResize, this)
          this.handleResize({ width: this.scale.width, height: this.scale.height })
        }

        update(_time: number, delta: number) {
          this.syncCurrentUser(delta)
          this.syncAgents()
        }

        private createCurrentUser() {
          this.playerBody = this.add.circle(currentUserRef.current.x, currentUserRef.current.y, PLAYER_RADIUS, 0x2563eb)
          this.playerBody.setStrokeStyle(5, 0xfffbeb, 1)

          this.playerLabel = this.add.text(currentUserRef.current.x - 28, currentUserRef.current.y + 40, currentUserRef.current.label, {
            color: '#1e3a8a',
            fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
            fontSize: '15px',
            backgroundColor: 'rgba(255,247,237,0.92)',
            padding: { x: 8, y: 4 },
          })
        }

        private syncCurrentUser(delta: number) {
          const horizontal =
            Number(this.keys.right.isDown || this.wasdKeys.right.isDown) -
            Number(this.keys.left.isDown || this.wasdKeys.left.isDown)
          const vertical =
            Number(this.keys.down.isDown || this.wasdKeys.down.isDown) -
            Number(this.keys.up.isDown || this.wasdKeys.up.isDown)

          const currentSnapshot = currentUserRef.current
          let nextX = currentSnapshot.x
          let nextY = currentSnapshot.y

          if (horizontal !== 0 || vertical !== 0) {
            const magnitude = Math.hypot(horizontal, vertical) || 1
            const distance = PLAYER_SPEED * (delta / 1000)
            nextX += (horizontal / magnitude) * distance
            nextY += (vertical / magnitude) * distance
            nextX = clampToWorld(nextX, PLAYER_RADIUS + 40, MAP_WIDTH - PLAYER_RADIUS - 40)
            nextY = clampToWorld(nextY, PLAYER_RADIUS + 40, MAP_HEIGHT - PLAYER_RADIUS - 40)
          }

          this.playerBody.setPosition(nextX, nextY)
          this.playerLabel.setPosition(nextX - 28, nextY + 40).setText(currentSnapshot.label)
          this.cameras.main.centerOn(nextX, nextY)

          if (nextX !== currentSnapshot.x || nextY !== currentSnapshot.y) {
            const nextUser = { ...currentSnapshot, x: nextX, y: nextY }
            currentUserRef.current = nextUser
            onCurrentUserChange(nextUser)
          }
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
  }, [onCurrentUserChange])

  return (
    <div className="world-surface">
      <div className="world-status">
        <div>
          <p className="eyebrow">Room</p>
          <h2>Agents: {agents.length}</h2>
        </div>
        <p className="world-helper">
          {isLoading
            ? 'Loading backend roster.'
            : errorMessage
              ? 'Backend roster unavailable.'
              : agents.length > 0
                ? 'Phaser-mounted once per load.'
                : 'No backend agents returned.'}
        </p>
      </div>

      <div className="world-canvas-shell">
        <div ref={mountRef} className="world-phaser-host" aria-label="Phaser map viewport" />
      </div>
    </div>
  )
}

function clampToWorld(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
