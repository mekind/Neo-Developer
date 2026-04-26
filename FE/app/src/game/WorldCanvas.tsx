import { useEffect, useRef } from 'react'

import { INTERACTION_RADIUS, WORLD_HEIGHT, WORLD_WIDTH, measureDistance, type WorldCharacter } from './characters'

type WorldCanvasProps = {
  characters: WorldCharacter[]
  currentCharacter: WorldCharacter | null
  interactionTarget: WorldCharacter | null
  playerStatusCopy: string
  interactionStatusCopy: string
  lastInteractionMessage: string | null
}

export function WorldCanvas({
  characters,
  currentCharacter,
  interactionTarget,
  playerStatusCopy,
  interactionStatusCopy,
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

    if (characters.length === 0) {
      context.fillStyle = 'rgba(77, 70, 63, 0.72)'
      context.font = '18px Pretendard, SUIT, "Noto Sans KR", sans-serif'
      context.fillText('Room is empty', 28, 92)
      return
    }

    characters.forEach((character, index) => {
      const isCurrent = currentCharacter?.id === character.id
      const isInteractionTarget = interactionTarget?.id === character.id

      if (isCurrent) {
        context.strokeStyle = 'rgba(34, 197, 94, 0.4)'
        context.lineWidth = 10
        context.beginPath()
        context.arc(character.x, character.y, INTERACTION_RADIUS, 0, Math.PI * 2)
        context.stroke()
      }

      context.fillStyle = character.color
      context.beginPath()
      context.arc(character.x, character.y, 18, 0, Math.PI * 2)
      context.fill()

      context.strokeStyle = isCurrent ? '#f8fafc' : isInteractionTarget ? '#facc15' : 'rgba(226,232,240,0.45)'
      context.lineWidth = isCurrent || isInteractionTarget ? 3 : 1
      context.stroke()

      context.fillStyle = '#4d463f'
      context.font = '14px Pretendard, SUIT, "Noto Sans KR", sans-serif'
      context.fillText(`${index + 1}. ${character.name}`, character.x - 22, character.y + 38)
    })

    if (currentCharacter && interactionTarget) {
      context.fillStyle = '#facc15'
      context.font = '15px sans-serif'
      context.fillText(`Interaction ready: ${currentCharacter.name} ↔ ${interactionTarget.name}`, 24, height - 32)
    }
  }, [characters, currentCharacter, interactionTarget])

  return (
    <div className="world-surface">
      <div className="world-status">
        <div>
          <p className="eyebrow">Room</p>
          <h3>{characters.length} online</h3>
          <p className="world-helper world-helper-strong">{playerStatusCopy}</p>
        </div>
        <p className="world-helper">{currentCharacter ? interactionStatusCopy : '첫 번째 에이전트를 추가하세요.'}</p>
      </div>
      <canvas ref={canvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT} aria-label="2D world prototype canvas" />
      <div className="world-feedback" aria-live="polite">
        <p>{lastInteractionMessage ?? 'No interaction triggered yet.'}</p>
        {currentCharacter && interactionTarget ? (
          <p>
            Distance to {interactionTarget.name}: {Math.round(measureDistance(currentCharacter, interactionTarget))}px
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
