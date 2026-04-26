import '@testing-library/jest-dom'

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    fillText: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    set fillStyle(_value: string | CanvasGradient | CanvasPattern) {},
    set strokeStyle(_value: string | CanvasGradient | CanvasPattern) {},
    set lineWidth(_value: number) {},
    set font(_value: string) {},
  }),
})
