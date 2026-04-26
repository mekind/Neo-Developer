import { useEffect, useRef } from 'react'

import { INTERACTION_RADIUS_PERCENT, measurePercentDistance, type WorldAgent, type WorldPlayer } from './agents'

type WorldCanvasProps = {
  agents: WorldAgent[]
  player: WorldPlayer
  isLoading: boolean
  errorMessage: string | null
  interactionTarget: WorldAgent | null
  lastInteractionMessage: string | null
}

export function WorldCanvas({
  agents,
  player,
  isLoading,
  errorMessage,
  interactionTarget,
  lastInteractionMessage,
}: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const width = canvas.width
    const height = canvas.height

    context.clearRect(0, 0, width, height)

    const wallGradient = context.createLinearGradient(0, 0, 0, height)
    wallGradient.addColorStop(0, '#f7efe3')
    wallGradient.addColorStop(0.5, '#efe3d2')
    wallGradient.addColorStop(1, '#e4d2bc')
    context.fillStyle = wallGradient
    context.fillRect(0, 0, width, height)

    context.fillStyle = '#d9b792'
    context.fillRect(0, height - 170, width, 170)

    context.fillStyle = '#c39868'
    for (let x = 0; x < width; x += 64) {
      context.fillRect(x, height - 170, 4, 170)
    }

    context.fillStyle = '#9b7959'
    context.fillRect(56, 72, width - 112, 22)

    const windows = [150, 390, 630, 870]
    windows.forEach((x) => {
      context.fillStyle = '#a47b59'
      context.fillRect(x, 104, 150, 168)
      context.fillStyle = '#dcedef'
      context.fillRect(x + 12, 116, 126, 144)
      context.strokeStyle = 'rgba(255,255,255,0.55)'
      context.lineWidth = 4
      context.beginPath()
      context.moveTo(x + 75, 116)
      context.lineTo(x + 75, 260)
      context.moveTo(x + 12, 188)
      context.lineTo(x + 138, 188)
      context.stroke()
    })

    context.fillStyle = '#78916d'
    context.fillRect(1020, 124, 38, 118)
    context.beginPath()
    context.arc(1039, 104, 42, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#d0ae80'
    context.fillRect(176, 342, 220, 86)
    context.fillRect(480, 360, 250, 96)
    context.fillRect(834, 334, 200, 82)

    context.fillStyle = '#936846'
    ;[
      [200, 428, 12, 76],
      [360, 428, 12, 76],
      [510, 456, 12, 70],
      [688, 456, 12, 70],
      [860, 416, 12, 74],
      [1010, 416, 12, 74],
    ].forEach(([x, y, w, h]) => {
      context.fillRect(x, y, w, h)
    })

    context.fillStyle = '#efd48a'
    context.beginPath()
    context.arc(1116, 124, 28, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = 'rgba(239, 212, 138, 0.2)'
    context.beginPath()
    context.arc(1116, 124, 78, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#4d463f'
    context.font = 'bold 18px Pretendard, SUIT, "Noto Sans KR", sans-serif'
    context.fillText('School Commons', 28, 42)
  }, [])

  const distanceToTarget = interactionTarget ? measurePercentDistance(player, interactionTarget) : null

  return (
    <div className="world-surface">
      <div className="world-status">
        <div>
          <p className="eyebrow">Room</p>
          <h2>Agents: {agents.length}</h2>
          <p className="world-helper world-helper-strong">
            Controlling {player.label} at ({player.xPercent.toFixed(0)}%, {player.yPercent.toFixed(0)}%).
          </p>
        </div>
        <p className="world-helper">
          {isLoading
            ? 'Loading backend roster.'
            : errorMessage
              ? 'Backend roster unavailable.'
              : interactionTarget
                ? `Press E near ${interactionTarget.label} to interact.`
                : agents.length > 0
                  ? 'Move closer to an agent NPC to interact.'
                  : 'No backend agents returned.'}
        </p>
      </div>

      <div className="world-canvas-stage">
        <canvas ref={canvasRef} width={1280} height={720} aria-label="2D world prototype canvas" />

        <div className="world-agent-layer" aria-label="Backend world agents">
          <figure
            className="world-agent world-player"
            style={{ left: `${player.xPercent}%`, top: `${player.yPercent}%` }}
          >
            <div className="world-agent-ring" style={{ width: `${INTERACTION_RADIUS_PERCENT * 2}%`, height: `${INTERACTION_RADIUS_PERCENT * 2}%` }} />
            <img src={player.imageSrc} alt={`${player.label} avatar`} className="world-agent-avatar" />
            <figcaption>{player.label}</figcaption>
          </figure>

          {!isLoading && !errorMessage && agents.length > 0
            ? agents.map((agent) => (
                <figure
                  key={agent.id}
                  className={`world-agent${interactionTarget?.id === agent.id ? ' world-agent-target' : ''}`}
                  style={{ left: `${agent.xPercent}%`, top: `${agent.yPercent}%` }}
                >
                  <img src={agent.imageSrc} alt={`${agent.label} avatar`} className="world-agent-avatar" />
                  <figcaption>{agent.label}</figcaption>
                </figure>
              ))
            : null}
        </div>
      </div>

      <div className="world-feedback" aria-live="polite">
        <p>{lastInteractionMessage ?? 'No interaction triggered yet.'}</p>
        {distanceToTarget !== null ? <p>Distance to {interactionTarget?.label}: {distanceToTarget.toFixed(1)}%</p> : null}
      </div>
    </div>
  )
}
