import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'

import { buildWorldPlayer, INTERACTION_RADIUS_PERCENT, measurePercentDistance, type WorldAgent } from './agents'
import { type LpcAnimationName, type LpcFrameMap, type LpcSpriteCatalog } from './lpcSprite'
import {
  moveWorldPosition,
  PLAYER_MOVEMENT_SPEED,
  resolvePlayerMovementStep,
  type MovementVector,
} from './playerMovement'

type WorldCanvasProps = {
  agents: WorldAgent[]
  lpcSpriteCatalog: LpcSpriteCatalog
  onAgentInteraction: (agent: WorldAgent) => void
}

type FacingDirection = 'n' | 's' | 'e' | 'w'

type SceneBody = Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite

type SceneActor = {
  body: SceneBody
  label: Phaser.GameObjects.Text
  speech: Phaser.GameObjects.Text
}

type ResolvedSpriteBundle = {
  bundleKey: string
  characterPngUrl: string
  frameMap: LpcFrameMap
}

const MAP_WIDTH = 1254
const MAP_HEIGHT = 1254
const VIEWPORT_WIDTH = 1280
const VIEWPORT_HEIGHT = 720
const PLAYER_RADIUS = 24
const AGENT_RADIUS = 22
const MINIMAP_WIDTH = 128
const MINIMAP_HEIGHT = 128
const MINIMAP_MARGIN = 8
const CAMERA_LERP = 0.18
const CAMERA_ZOOM = 0.82
const SPEECH_MS = 1200
const ROOM_TEXTURE_KEY = 'office-room'
const ROOM_TEXTURE_PATH = '/maps/office-room.png'

const OBSTACLES = [
  { x: 205, y: 291, width: 157, height: 86 },
  { x: 438, y: 291, width: 250, height: 161 },
  { x: 824, y: 215, width: 182, height: 179 },
  { x: 1042, y: 188, width: 109, height: 200 },
  { x: 220, y: 529, width: 185, height: 254 },
  { x: 653, y: 529, width: 322, height: 180 },
  { x: 91, y: 858, width: 217, height: 136 },
  { x: 768, y: 804, width: 339, height: 191 },
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

function getMinimapViewport(gameWidth: number) {
  return {
    x: Math.max(MINIMAP_MARGIN, gameWidth - MINIMAP_WIDTH - MINIMAP_MARGIN),
    y: MINIMAP_MARGIN,
    width: MINIMAP_WIDTH,
    height: MINIMAP_HEIGHT,
  }
}

function projectMiniMapPoint(xPercent: number, yPercent: number, viewport: ReturnType<typeof getMinimapViewport>) {
  return {
    x: viewport.x + xPercent * (viewport.width / 100),
    y: viewport.y + yPercent * (viewport.height / 100),
  }
}

function getFacingDirection(vector: MovementVector, current: FacingDirection): FacingDirection {
  if (vector.x === 0 && vector.y === 0) return current
  if (Math.abs(vector.x) > Math.abs(vector.y)) return vector.x > 0 ? 'e' : 'w'
  return vector.y > 0 ? 's' : 'n'
}

function toAnimationName(isMoving: boolean, facing: FacingDirection): LpcAnimationName {
  return `${isMoving ? 'walk' : 'idle'}_${facing}`
}

function createTextureKey(bundleKey: string) {
  return `lpc-sheet-${bundleKey}`
}

function createAnimationKey(bundleKey: string, name: LpcAnimationName) {
  return `lpc-anim-${bundleKey}-${name}`
}

function buildAnimationFrameNumbers(frameMap: LpcFrameMap, sheetColumns: number, name: LpcAnimationName) {
  const animation = frameMap.animations[name]
  const rowIndex = Math.floor(animation.y / frameMap.frameSize)
  return animation.frames.map((frame) => rowIndex * sheetColumns + frame)
}

function resolveLocalBundle(bundleId: string | null, catalog: LpcSpriteCatalog): ResolvedSpriteBundle | null {
  if (!bundleId) return null
  const bundle = catalog[bundleId]
  if (!bundle) return null
  return {
    bundleKey: `local-${bundle.bundleId}`,
    characterPngUrl: bundle.characterPngUrl,
    frameMap: bundle.frameMap,
  }
}

function resolveAgentBundle(agent: WorldAgent, catalog: LpcSpriteCatalog): ResolvedSpriteBundle | null {
  if (agent.apiSprite) {
    return {
      bundleKey: agent.apiSprite.bundleKey,
      characterPngUrl: agent.apiSprite.characterPngUrl,
      frameMap: agent.apiSprite.frameMap,
    }
  }

  return resolveLocalBundle(agent.spriteBundleId, catalog)
}

export function WorldCanvas({ agents, lpcSpriteCatalog, onAgentInteraction }: WorldCanvasProps) {
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

      const PhaserModule = await import('phaser')
      const Phaser = (PhaserModule.default ?? PhaserModule) as typeof PhaserModule
      if (cancelled || !mountRef.current) return

      class BackendRosterScene extends Phaser.Scene {
        private minimapLayer!: Phaser.GameObjects.Graphics
        private playerMarker!: Phaser.GameObjects.Arc
        private playerHalo!: Phaser.GameObjects.Arc
        private playerLabel!: Phaser.GameObjects.Text
        private promptText!: Phaser.GameObjects.Text
        private minimapLegend!: Phaser.GameObjects.Text
        private playerSprite?: Phaser.GameObjects.Sprite
        private playerBundle = resolveLocalBundle(buildWorldPlayer().spriteBundleId, lpcSpriteCatalog)
        private agentSprites = new Map<string, SceneActor>()
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
        private spaceKey?: Phaser.Input.Keyboard.Key
        private playerFacing: FacingDirection = 's'
        private playerAnimationName: LpcAnimationName = 'idle_s'
        private playerState = {
          ...buildWorldPlayer(),
          velocity: { x: 0, y: 0 } as MovementVector,
        }
        private currentInteractionTarget: WorldAgent | null = null
        private speechByAgent = new Map<string, number>()

        preload() {
          this.load.image(ROOM_TEXTURE_KEY, ROOM_TEXTURE_PATH)

          const bundleMap = new Map<string, ResolvedSpriteBundle>()
          if (this.playerBundle) bundleMap.set(this.playerBundle.bundleKey, this.playerBundle)
          agentsRef.current.forEach((agent) => {
            const bundle = resolveAgentBundle(agent, lpcSpriteCatalog)
            if (bundle) bundleMap.set(bundle.bundleKey, bundle)
          })

          for (const bundle of bundleMap.values()) {
            this.load.spritesheet(createTextureKey(bundle.bundleKey), bundle.characterPngUrl, {
              frameWidth: bundle.frameMap.frameSize,
              frameHeight: bundle.frameMap.frameSize,
            })
          }
        }

        create() {
          this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
          this.cameras.main.setBackgroundColor('#111827')
          this.add.image(MAP_WIDTH / 2, MAP_HEIGHT / 2, ROOM_TEXTURE_KEY).setDisplaySize(MAP_WIDTH, MAP_HEIGHT)

          const bundleMap = new Map<string, ResolvedSpriteBundle>()
          if (this.playerBundle) bundleMap.set(this.playerBundle.bundleKey, this.playerBundle)
          agentsRef.current.forEach((agent) => {
            const bundle = resolveAgentBundle(agent, lpcSpriteCatalog)
            if (bundle) bundleMap.set(bundle.bundleKey, bundle)
          })
          bundleMap.forEach((bundle) => this.registerLpcAnimations(bundle))

          this.minimapLayer = this.add.graphics().setScrollFactor(0).setDepth(30)
          this.playerHalo = this.add.circle(projectX(this.playerState.xPercent), projectY(this.playerState.yPercent), PLAYER_RADIUS * 2.1, 0x22c55e, 0.12)
          this.playerHalo.setStrokeStyle(3, 0x22c55e, 0.3)
          this.playerMarker = this.add.circle(projectX(this.playerState.xPercent), projectY(this.playerState.yPercent), PLAYER_RADIUS, 0x22c55e)
          this.playerMarker.setStrokeStyle(4, 0xfffbeb, 1)
          this.playerMarker.setAlpha(this.playerBundle ? 0 : 1)

          if (this.playerBundle) {
            this.playerSprite = this.add.sprite(
              projectX(this.playerState.xPercent),
              projectY(this.playerState.yPercent) + 10,
              createTextureKey(this.playerBundle.bundleKey),
            )
            this.playerSprite.setDisplaySize(48, 48)
            this.playerSprite.setDepth(14)
          }

          this.playerLabel = this.add.text(0, 0, this.playerState.label, {
            color: '#f8fafc',
            fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
            fontSize: '11px',
            backgroundColor: 'rgba(17,24,39,0.82)',
            padding: { x: 8, y: 4 },
          }).setDepth(20)
          this.minimapLegend = this.add.text(0, 0, 'ME / NPC', {
            color: '#f8fafc',
            fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
            fontSize: '9px',
            backgroundColor: 'rgba(17,24,39,0.78)',
            padding: { x: 6, y: 2 },
          }).setScrollFactor(0).setDepth(31)
          this.promptText = this.add.text(640, 664, '', {
            color: '#f8fafc',
            fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
            fontSize: '16px',
            backgroundColor: 'rgba(17,24,39,0.82)',
            padding: { x: 14, y: 8 },
          })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(40)
            .setVisible(false)

          this.syncInteractionUi()
          this.syncSprites(this.time.now)
          this.cameras.main.setZoom(CAMERA_ZOOM)
          this.cameras.main.startFollow(this.playerMarker, true, CAMERA_LERP, CAMERA_LERP)

          this.cursors = this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys)
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
          const movement = resolvePlayerMovementStep(getInputVector(this.cursors), this.playerState.velocity, PLAYER_MOVEMENT_SPEED, delta)
          this.playerState.velocity = movement.velocity
          this.playerFacing = getFacingDirection(movement.velocity, this.playerFacing)

          const rawNext = moveWorldPosition(this.playerState, movement.velocity, delta)
          const attempted = clampWorldPoint(projectX(rawNext.xPercent), projectY(rawNext.yPercent))
          const current = { x: projectX(this.playerState.xPercent), y: projectY(this.playerState.yPercent) }
          const resolved = this.resolveCollision(current, attempted)
          this.playerState.xPercent = unprojectX(resolved.x)
          this.playerState.yPercent = unprojectY(resolved.y)

          this.syncInteractionUi()
          this.syncSprites(time)
          this.drawMinimap()
        }

        private registerLpcAnimations(bundle: ResolvedSpriteBundle) {
          const textureKey = createTextureKey(bundle.bundleKey)
          const textureSource = this.textures.get(textureKey).getSourceImage() as { width: number }
          const sheetColumns = Math.floor(textureSource.width / bundle.frameMap.frameSize)
          const animationNames = Object.keys(bundle.frameMap.animations) as LpcAnimationName[]

          animationNames.forEach((name) => {
            const key = createAnimationKey(bundle.bundleKey, name)
            if (this.anims.exists(key)) return

            this.anims.create({
              key,
              frames: buildAnimationFrameNumbers(bundle.frameMap, sheetColumns, name).map((frame) => ({ key: textureKey, frame })),
              frameRate: bundle.frameMap.animations[name].fps,
              repeat: -1,
            })
          })
        }

        private resolveCollision(current: { x: number; y: number }, attempted: { x: number; y: number }) {
          const tryPoint = (candidate: { x: number; y: number }) => {
            if (OBSTACLES.some((rect) => circleIntersectsRect(candidate.x, candidate.y, PLAYER_RADIUS, rect))) return false
            if (agentsRef.current.some((agent) => circlesOverlap(candidate.x, candidate.y, PLAYER_RADIUS, projectX(agent.xPercent), projectY(agent.yPercent), AGENT_RADIUS))) return false
            return true
          }
          if (tryPoint(attempted)) return attempted
          const xOnly = { x: attempted.x, y: current.y }
          if (tryPoint(xOnly)) return xOnly
          const yOnly = { x: current.x, y: attempted.y }
          if (tryPoint(yOnly)) return yOnly
          return current
        }

        private playActorAnimation(target: Phaser.GameObjects.Sprite, bundleKey: string, name: LpcAnimationName) {
          const key = createAnimationKey(bundleKey, name)
          if (target.anims.currentAnim?.key === key) return
          target.play(key, true)
        }

        private createAgentBody(agent: WorldAgent, x: number, y: number, isTarget: boolean): SceneBody {
          const bundle = resolveAgentBundle(agent, lpcSpriteCatalog)
          if (bundle) {
            const sprite = this.add.sprite(x, y + 10, createTextureKey(bundle.bundleKey))
            sprite.setDisplaySize(44, 44)
            sprite.setDepth(12)
            sprite.setTint(isTarget ? 0xffe5a3 : 0xffffff)
            this.playActorAnimation(sprite, bundle.bundleKey, 'idle_s')
            return sprite
          }

          const fillColor = isTarget ? 0xf59e0b : agent.usesPlaceholder ? 0xfde68a : 0x93c5fd
          const body = this.add.circle(x, y, AGENT_RADIUS, fillColor).setDepth(10)
          body.setStrokeStyle(4, 0xfffbeb, 1)
          return body
        }

        private updateAgentBody(agent: WorldAgent, body: SceneBody, x: number, y: number, isTarget: boolean) {
          const bundle = resolveAgentBundle(agent, lpcSpriteCatalog)
          if (bundle && body instanceof Phaser.GameObjects.Sprite) {
            body.setPosition(x, y + 10)
            body.setTint(isTarget ? 0xffe5a3 : 0xffffff)
            this.playActorAnimation(body, bundle.bundleKey, 'idle_s')
            return
          }

          if (body instanceof Phaser.GameObjects.Arc) {
            const fillColor = isTarget ? 0xf59e0b : agent.usesPlaceholder ? 0xfde68a : 0x93c5fd
            body.setPosition(x, y)
            body.setFillStyle(fillColor)
          }
        }

        private syncSprites(time: number) {
          const snapshot = agentsRef.current
          const ids = new Set(snapshot.map((agent) => agent.id))
          const playerX = projectX(this.playerState.xPercent)
          const playerY = projectY(this.playerState.yPercent)
          const playerIsMoving = this.playerState.velocity.x !== 0 || this.playerState.velocity.y !== 0
          const nextPlayerAnimation = toAnimationName(playerIsMoving, this.playerFacing)

          this.playerHalo.setPosition(playerX, playerY)
          this.playerMarker.setPosition(playerX, playerY)
          this.playerLabel.setPosition(playerX - 18, playerY + 22).setText(this.playerState.label)

          if (this.playerSprite && this.playerBundle) {
            this.playerSprite.setPosition(playerX, playerY + 10)
            if (this.playerAnimationName !== nextPlayerAnimation) {
              this.playerAnimationName = nextPlayerAnimation
              this.playActorAnimation(this.playerSprite, this.playerBundle.bundleKey, nextPlayerAnimation)
            }
          }

          snapshot.forEach((agent) => {
            const existing = this.agentSprites.get(agent.id)
            const x = projectX(agent.xPercent)
            const y = projectY(agent.yPercent)
            const isTarget = this.currentInteractionTarget?.id === agent.id

            if (!existing) {
              const body = this.createAgentBody(agent, x, y, isTarget)
              const label = this.add.text(x - 34, y + 28, agent.label, {
                color: '#f8fafc',
                fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
                fontSize: '11px',
                backgroundColor: 'rgba(17,24,39,0.78)',
                padding: { x: 6, y: 3 },
              }).setDepth(20)
              const speech = this.add.text(x, y - 42, '안녕', {
                color: '#234035',
                fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
                fontSize: '12px',
                backgroundColor: 'rgba(255,255,255,0.96)',
                padding: { x: 10, y: 5 },
              }).setOrigin(0.5).setVisible(false).setDepth(20)
              this.agentSprites.set(agent.id, { body, label, speech })
              return
            }

            this.updateAgentBody(agent, existing.body, x, y, isTarget)
            existing.label.setPosition(x - 34, y + 28).setText(agent.label)
            existing.speech.setPosition(x, y - 42)
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
          this.currentInteractionTarget = agentsRef.current
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

        private drawMinimap() {
          const camera = this.cameras.main
          const viewport = getMinimapViewport(this.scale.width)
          this.minimapLayer.clear()
          this.minimapLayer.fillStyle(0x161e18, 0.82)
          this.minimapLayer.fillRoundedRect(viewport.x, viewport.y, viewport.width, viewport.height, 16)
          this.minimapLayer.fillStyle(0xffffff, 0.94)
          this.minimapLayer.fillRoundedRect(viewport.x + 6, viewport.y + 6, viewport.width - 12, viewport.height - 12, 12)
          this.minimapLayer.lineStyle(1, 0x111827, 0.18)
          this.minimapLayer.strokeRoundedRect(viewport.x + 6, viewport.y + 6, viewport.width - 12, viewport.height - 12, 12)

          agentsRef.current.forEach((agent) => {
            const point = projectMiniMapPoint(agent.xPercent, agent.yPercent, viewport)
            this.minimapLayer.fillStyle(agent.apiSprite || agent.spriteBundleId ? 0x2563eb : agent.usesPlaceholder ? 0xf59e0b : 0x2563eb, 1)
            this.minimapLayer.fillCircle(point.x, point.y, 3.5)
          })
          const playerPoint = projectMiniMapPoint(this.playerState.xPercent, this.playerState.yPercent, viewport)
          this.minimapLayer.fillStyle(0x22c55e, 1)
          this.minimapLayer.fillCircle(playerPoint.x, playerPoint.y, 4.5)
          this.minimapLayer.lineStyle(1.5, 0xffffff, 0.95)
          this.minimapLayer.strokeCircle(playerPoint.x, playerPoint.y, 4.5)

          const innerX = viewport.x + 6
          const innerY = viewport.y + 6
          const innerW = viewport.width - 12
          const innerH = viewport.height - 12
          const rectX = innerX + (camera.worldView.x / MAP_WIDTH) * innerW
          const rectY = innerY + (camera.worldView.y / MAP_HEIGHT) * innerH
          const rectW = (camera.worldView.width / MAP_WIDTH) * innerW
          const rectH = (camera.worldView.height / MAP_HEIGHT) * innerH
          this.minimapLayer.lineStyle(2, 0x111827, 0.92)
          this.minimapLayer.strokeRoundedRect(rectX, rectY, rectW, rectH, 8)

          this.minimapLegend.setPosition(viewport.x, Math.max(4, viewport.y - 18))
        }

        private handleResize(gameSize: { width: number; height: number }) {
          this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height)
          this.promptText.setPosition(gameSize.width / 2, Math.max(32, gameSize.height - 36))
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current,
        backgroundColor: '#111827',
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
  }, [agents, lpcSpriteCatalog])

  return <div ref={mountRef} className="world-phaser-host" aria-label="Phaser map viewport" />
}
