import { useEffect, useMemo, useRef } from 'react'
import type Phaser from 'phaser'

import {
  INTERACTION_RADIUS,
  PLAYER_MOVE_SPEED,
  PLAYER_RADIUS,
  WORLD_HEIGHT,
  WORLD_OBSTACLES,
  WORLD_VIEWPORT_HEIGHT,
  WORLD_WIDTH,
  clampCharacterToMap,
  measureDistance,
  type WorldCharacter,
} from './characters'

type WorldCanvasProps = {
  characters: WorldCharacter[]
  onCharactersChange: (characters: WorldCharacter[]) => void
  onInteractionMessage: (message: string) => void
  currentCharacter: WorldCharacter | null
  interactionTarget: WorldCharacter | null
  playerStatusCopy: string
  interactionStatusCopy: string
  lastInteractionMessage: string | null
  phaserStatusCopy: string
}

type RuntimeBridge = {
  characters: WorldCharacter[]
  onCharactersChange: (characters: WorldCharacter[]) => void
  onInteractionMessage: (message: string) => void
}

const WORLD_VIEWPORT_WIDTH = 1280

type SceneSprites = {
  body: Phaser.GameObjects.Arc
  label: Phaser.GameObjects.Text
  halo: Phaser.GameObjects.Arc
}

type SceneKeys = {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
  interact: Phaser.Input.Keyboard.Key
}

export function WorldCanvas({
  characters,
  onCharactersChange,
  onInteractionMessage,
  currentCharacter,
  interactionTarget,
  playerStatusCopy,
  interactionStatusCopy,
  lastInteractionMessage,
  phaserStatusCopy,
}: WorldCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const bridgeRef = useRef<RuntimeBridge>({
    characters,
    onCharactersChange,
    onInteractionMessage,
  })

  bridgeRef.current.characters = characters
  bridgeRef.current.onCharactersChange = onCharactersChange
  bridgeRef.current.onInteractionMessage = onInteractionMessage

  useEffect(() => {
    let cancelled = false

    async function mountGame() {
      if (!mountRef.current || gameRef.current) return

      const Phaser = (await import('phaser')).default
      if (cancelled || !mountRef.current) return

      const bridge = bridgeRef

      class PrototypeWorldScene extends Phaser.Scene {
        private keys!: SceneKeys
        private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys
        private characterSprites = new Map<string, SceneSprites>()
        private background!: Phaser.GameObjects.Graphics
        private obstacleLayer!: Phaser.GameObjects.Graphics
        private followTarget!: Phaser.GameObjects.Zone

        create() {
          this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
          this.cameras.main.setBackgroundColor('#ece6da')

          this.background = this.add.graphics()
          this.obstacleLayer = this.add.graphics()
          this.drawBackground()
          this.drawObstacles()

          this.followTarget = this.add.zone(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 1, 1)
          this.cameras.main.startFollow(this.followTarget, true, 0.12, 0.12)

          this.keys = this.input.keyboard!.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
          }) as unknown as SceneKeys

          this.cursorKeys = this.input.keyboard!.createCursorKeys()

          this.scale.on('resize', this.handleResize, this)
          this.handleResize({ width: this.scale.width, height: this.scale.height })
          this.syncCharacters()
        }

        update(_time: number, delta: number) {
          const snapshot = bridge.current.characters
          if (snapshot.length > 0) {
            const moved = this.applyMovement(snapshot, delta)
            if (moved !== snapshot) {
              bridge.current.onCharactersChange(moved)
            }
          }

          if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
            const activeCharacters = bridge.current.characters
            const player = activeCharacters.at(-1)
            const target = player ? getNearestInteractionTarget(player, activeCharacters) : null

            if (player && target) {
              bridge.current.onInteractionMessage(`${player.name} greeted ${target.name}.`)
            }
          }

          this.syncCharacters()
        }

        private applyMovement(sourceCharacters: WorldCharacter[], delta: number) {
          const player = sourceCharacters.at(-1)
          if (!player) return sourceCharacters

          const directionX =
            Number(this.keys.right.isDown || this.cursorKeys.right.isDown) -
            Number(this.keys.left.isDown || this.cursorKeys.left.isDown)
          const directionY =
            Number(this.keys.down.isDown || this.cursorKeys.down.isDown) -
            Number(this.keys.up.isDown || this.cursorKeys.up.isDown)

          if (directionX === 0 && directionY === 0) {
            this.followTarget.setPosition(player.x, player.y)
            return sourceCharacters
          }

          const vector = new Phaser.Math.Vector2(directionX, directionY).normalize()
          const distance = PLAYER_MOVE_SPEED * (delta / 1000)
          const movedPlayer = clampCharacterToMap(
            player,
            player.x + vector.x * distance,
            player.y + vector.y * distance,
          )

          this.followTarget.setPosition(movedPlayer.x, movedPlayer.y)

          if (movedPlayer.x === player.x && movedPlayer.y === player.y) {
            return sourceCharacters
          }

          return sourceCharacters.map((character, index, all) => (index === all.length - 1 ? movedPlayer : character))
        }

        private syncCharacters() {
          const snapshot = bridge.current.characters
          const currentIds = new Set(snapshot.map((character) => character.id))

          snapshot.forEach((character, index) => {
            const existing = this.characterSprites.get(character.id)
            const target = getNearestInteractionTarget(character, snapshot, character.id === snapshot.at(-1)?.id)
            const isPlayer = character.id === snapshot.at(-1)?.id
            const isInteractionTarget = snapshot.at(-1)?.id !== character.id && target?.id === character.id

            if (!existing) {
              const halo = this.add.circle(character.x, character.y, INTERACTION_RADIUS)
              halo.setStrokeStyle(3, 0x4ade80, 0.28)
              halo.setVisible(isPlayer)

              const body = this.add.circle(character.x, character.y, PLAYER_RADIUS, Phaser.Display.Color.HexStringToColor(character.color).color)
              body.setStrokeStyle(isPlayer ? 4 : 2, isInteractionTarget ? 0xfacc15 : 0xf8fafc, 1)

              const label = this.add
                .text(character.x - 26, character.y + 28, `${index + 1}. ${character.name}`, {
                  color: '#3d332d',
                  fontFamily: 'Pretendard, SUIT, "Noto Sans KR", sans-serif',
                  fontSize: '14px',
                })
                .setDepth(1)

              this.characterSprites.set(character.id, { body, label, halo })
              return
            }

            existing.body.setPosition(character.x, character.y)
            existing.body.setFillStyle(Phaser.Display.Color.HexStringToColor(character.color).color)
            existing.body.setStrokeStyle(isPlayer ? 4 : 2, isInteractionTarget ? 0xfacc15 : 0xf8fafc, 1)
            existing.label.setPosition(character.x - 26, character.y + 28).setText(`${index + 1}. ${character.name}`)
            existing.halo.setPosition(character.x, character.y).setVisible(isPlayer)
          })

          for (const [id, sprite] of this.characterSprites.entries()) {
            if (currentIds.has(id)) continue
            sprite.body.destroy()
            sprite.label.destroy()
            sprite.halo.destroy()
            this.characterSprites.delete(id)
          }

          const player = snapshot.at(-1)
          if (player) {
            this.followTarget.setPosition(player.x, player.y)
          }
        }

        private drawBackground() {
          this.background.clear()

          this.background.fillStyle(0xf7efe3, 1)
          this.background.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
          this.background.fillStyle(0xe4d2bc, 1)
          this.background.fillRect(0, WORLD_HEIGHT - 220, WORLD_WIDTH, 220)
          this.background.fillStyle(0x9b7959, 1)
          this.background.fillRect(80, 88, WORLD_WIDTH - 160, 28)

          for (let x = 0; x < WORLD_WIDTH; x += 120) {
            this.background.fillStyle(x % 240 === 0 ? 0xc8a883 : 0xd8baa0, 0.2)
            this.background.fillRect(x, 0, 6, WORLD_HEIGHT)
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

          WORLD_OBSTACLES.forEach((obstacle) => {
            this.obstacleLayer.fillStyle(Phaser.Display.Color.HexStringToColor(obstacle.color).color, 1)
            this.obstacleLayer.fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 20)
            this.obstacleLayer.lineStyle(3, 0x8c6d52, 0.7)
            this.obstacleLayer.strokeRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 20)
          })
        }

        private handleResize(gameSize: { width: number; height: number }) {
          this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height)
        }
      }

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current,
        backgroundColor: '#ece6da',
        scale: {
          mode: Phaser.Scale.RESIZE,
          parent: mountRef.current,
          width: WORLD_VIEWPORT_WIDTH,
          height: WORLD_VIEWPORT_HEIGHT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [PrototypeWorldScene],
      })

      gameRef.current = game
    }

    void mountGame()

    return () => {
      cancelled = true
      gameRef.current?.destroy(true, false)
      gameRef.current = null
    }
  }, [])

  const interactionDistance = useMemo(() => {
    if (!currentCharacter || !interactionTarget) return null
    return Math.round(measureDistance(currentCharacter, interactionTarget))
  }, [currentCharacter, interactionTarget])

  return (
    <div className="world-surface">
      <div className="world-status">
        <div>
          <p className="eyebrow">Live world state</p>
          <h2>Spawned avatars: {characters.length}</h2>
          <p className="world-helper world-helper-strong">{playerStatusCopy}</p>
        </div>
        <p className="world-helper">{currentCharacter ? interactionStatusCopy : '첫 번째 캐릭터를 만들면 월드에 바로 반영됩니다.'}</p>
      </div>
      <div className="world-canvas-shell">
        <div ref={mountRef} className="world-phaser-host" aria-label="Phaser map viewport" />
      </div>
      <div className="world-feedback" aria-live="polite">
        <p>{lastInteractionMessage ?? 'No interaction triggered yet.'}</p>
        <p>{phaserStatusCopy}</p>
        {interactionDistance !== null ? (
          <p>
            Distance to {interactionTarget?.name}: {interactionDistance}px
          </p>
        ) : (
          <p>Bring your player close to another avatar to unlock the interaction prompt.</p>
        )}
      </div>
      {characters.length > 0 ? (
        <ul className="world-roster" aria-label="World roster">
          {characters.map((character) => (
            <li key={character.id}>
              <span className="world-roster-dot" style={{ backgroundColor: character.color }} aria-hidden="true" />
              {character.name} · {character.archetype}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

const getNearestInteractionTarget = (
  character: WorldCharacter,
  characters: WorldCharacter[],
  requireRange = false,
) => {
  const nearest = characters
    .filter((candidate) => candidate.id !== character.id)
    .map((candidate) => ({ candidate, distance: measureDistance(character, candidate) }))
    .sort((left, right) => left.distance - right.distance)[0]

  if (!nearest) return null
  if (requireRange && nearest.distance > INTERACTION_RADIUS) return null
  return nearest.candidate
}
