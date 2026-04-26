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
    context.fillStyle = '#dfe4dc'
    context.fillRect(0, 0, width, height)

    context.fillStyle = '#eef1eb'
    context.fillRect(36, 36, width - 72, height - 72)

    context.strokeStyle = 'rgba(89, 101, 82, 0.12)'
    for (let x = 40; x <= width; x += 40) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }

    for (let y = 40; y <= height; y += 40) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
    }

    context.fillStyle = '#c77952'
    context.fillRect(168, 116, 34, 34)

    context.fillStyle = '#6a745f'
    context.fillRect(248, 196, 52, 52)

    context.fillStyle = '#384136'
    context.font = '16px Pretendard, SUIT, "Noto Sans KR", sans-serif'
    context.fillText('차분하게 둘러보는 월드 미리보기', 28, 34)
    context.fillText('읽기 쉬운 톤과 부드러운 흐름을 우선합니다', 28, 58)
  }, [])

  return (
    <div className="world-surface">
      <canvas ref={canvasRef} width={720} height={480} aria-label="따뜻한 데모 공간 미리보기 캔버스" />
    </div>
  )
}
