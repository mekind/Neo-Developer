import { useEffect, useRef } from 'react'

export function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const width = canvas.width
    const height = canvas.height

    context.clearRect(0, 0, width, height)
    context.fillStyle = '#101826'
    context.fillRect(0, 0, width, height)

    context.strokeStyle = 'rgba(255,255,255,0.08)'
    for (let x = 0; x <= width; x += 40) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }

    for (let y = 0; y <= height; y += 40) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
    }

    context.fillStyle = '#6ee7b7'
    context.fillRect(180, 120, 28, 28)

    context.fillStyle = '#f8fafc'
    context.font = '16px sans-serif'
    context.fillText('World placeholder', 24, 32)
    context.fillText('2D movement + interactions start here', 24, 56)
  }, [])

  return (
    <div className="world-surface">
      <canvas ref={canvasRef} width={720} height={480} aria-label="2D world placeholder canvas" />
    </div>
  )
}
