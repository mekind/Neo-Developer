import {
  PLAYER_MOVEMENT_MAX_DELTA_MS,
  PLAYER_MOVEMENT_SPEED,
  moveWorldPosition,
  normalizeMovementInput,
  resolvePlayerMovementStep,
} from './playerMovement'

function nearlyEqual(actual: number, expected: number, epsilon = 0.000001) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(epsilon)
}

describe('playerMovement', () => {
  it('normalizes diagonal input before applying speed', () => {
    const normalized = normalizeMovementInput({ x: 1, y: 1 })

    nearlyEqual(normalized.x, Math.SQRT1_2)
    nearlyEqual(normalized.y, Math.SQRT1_2)
  })

  it('eases toward movement speed instead of snapping instantly', () => {
    const first = resolvePlayerMovementStep({ x: 1, y: 0 }, { x: 0, y: 0 }, PLAYER_MOVEMENT_SPEED, 16)
    const second = resolvePlayerMovementStep({ x: 1, y: 0 }, first.velocity, PLAYER_MOVEMENT_SPEED, 16)

    expect(first.isInputActive).toBe(true)
    expect(first.isMoving).toBe(true)
    expect(first.velocity.x).toBeGreaterThan(0)
    expect(first.velocity.x).toBeLessThan(PLAYER_MOVEMENT_SPEED)
    expect(second.velocity.x).toBeGreaterThan(first.velocity.x)
    expect(second.velocity.x).toBeLessThan(PLAYER_MOVEMENT_SPEED)
  })

  it('decelerates and snaps tiny drift to rest', () => {
    const slowing = resolvePlayerMovementStep({ x: 0, y: 0 }, { x: 20, y: 0 }, PLAYER_MOVEMENT_SPEED, 16)
    const stopped = resolvePlayerMovementStep({ x: 0, y: 0 }, { x: 1, y: 0 }, PLAYER_MOVEMENT_SPEED, 16)

    expect(slowing.isInputActive).toBe(false)
    expect(slowing.isMoving).toBe(true)
    expect(slowing.velocity.x).toBeGreaterThan(0)
    expect(slowing.velocity.x).toBeLessThan(20)
    expect(stopped.velocity).toEqual({ x: 0, y: 0 })
    expect(stopped.isMoving).toBe(false)
  })

  it('caps large frame deltas for stable smoothing', () => {
    const capped = resolvePlayerMovementStep({ x: 1, y: 0 }, { x: 0, y: 0 }, PLAYER_MOVEMENT_SPEED, 1000)
    const expected = resolvePlayerMovementStep({ x: 1, y: 0 }, { x: 0, y: 0 }, PLAYER_MOVEMENT_SPEED, PLAYER_MOVEMENT_MAX_DELTA_MS)

    nearlyEqual(capped.velocity.x, expected.velocity.x)
  })

  it('moves the player by velocity over time while respecting bounds', () => {
    expect(moveWorldPosition({ xPercent: 12, yPercent: 32 }, { x: 34, y: 0 }, 50).xPercent).toBeGreaterThan(12)
    expect(moveWorldPosition({ xPercent: 92, yPercent: 78 }, { x: 200, y: 200 }, 50)).toEqual({ xPercent: 92, yPercent: 78 })
  })
})
