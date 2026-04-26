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
    context.fillStyle = '#0f172a'
    context.fillRect(0, 0, width, height)

    context.fillStyle = '#14213d'
    context.fillRect(0, 0, width, 92)

    context.strokeStyle = 'rgba(255,255,255,0.08)'
    for (let x = 0; x <= width; x += 48) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }

    for (let y = 0; y <= height; y += 48) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
    }

    context.fillStyle = '#1d4ed8'
    context.fillRect(96, 132, 180, 140)
    context.fillRect(332, 188, 220, 180)
    context.fillRect(598, 108, 160, 220)

    context.fillStyle = '#6ee7b7'
    context.fillRect(408, 244, 28, 28)

    context.fillStyle = '#f8fafc'
    context.font = '16px sans-serif'
    context.fillText('World viewport placeholder', 24, 38)
    context.fillText('Top bar / sidebar outside the playable area', 24, 64)
  }, [])

  return (
    <div className="world-surface">
      <canvas ref={canvasRef} width={1280} height={720} aria-label="2D world placeholder canvas" />
    </div>
  )
}
