import '@testing-library/jest-dom'

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fillText: () => {},
    set fillStyle(_value: string | CanvasGradient | CanvasPattern) {},
    set strokeStyle(_value: string | CanvasGradient | CanvasPattern) {},
    set font(_value: string) {},
  }),
})

import { afterEach, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
})
