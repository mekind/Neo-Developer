import { useEffect, useRef } from 'react'

import { type WorldCharacter } from './characters'

type WorldCanvasProps = {
  characters: WorldCharacter[]
  currentCharacter: WorldCharacter | null
}

export function WorldCanvas({ characters, currentCharacter }: WorldCanvasProps) {
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
    context.fillText('Warm school commons prototype', 28, 42)
    context.font = '16px Pretendard, SUIT, "Noto Sans KR", sans-serif'
    context.fillText('새 에이전트는 생성 중 상태를 거쳐 완료 후 월드에 정식 반영됩니다.', 28, 68)

    if (characters.length === 0) {
      context.fillStyle = 'rgba(77, 70, 63, 0.72)'
      context.font = '18px Pretendard, SUIT, "Noto Sans KR", sans-serif'
      context.fillText('아직 생성된 에이전트가 없습니다.', 28, 120)
      return
    }

    characters.forEach((character, index) => {
      context.save()
      context.strokeStyle = currentCharacter?.id === character.id ? '#fffaf3' : 'rgba(77, 70, 63, 0.45)'
      context.lineWidth = currentCharacter?.id === character.id ? 3 : 1

      if (character.status === 'pending') {
        context.setLineDash([6, 4])
        context.strokeStyle = '#9b6a4f'
        context.beginPath()
        context.arc(character.x, character.y, 18, 0, Math.PI * 2)
        context.stroke()
        context.setLineDash([])

        context.fillStyle = 'rgba(217, 178, 106, 0.22)'
        context.beginPath()
        context.arc(character.x, character.y, 18, 0, Math.PI * 2)
        context.fill()

        context.fillStyle = '#7a5b45'
        context.font = '12px Pretendard, SUIT, "Noto Sans KR", sans-serif'
        context.fillText('Generating…', character.x - 34, character.y - 28)
      } else {
        context.fillStyle = character.color
        context.beginPath()
        context.arc(character.x, character.y, 18, 0, Math.PI * 2)
        context.fill()
        context.stroke()
      }

      context.fillStyle = '#4d463f'
      context.font = '14px Pretendard, SUIT, "Noto Sans KR", sans-serif'
      context.fillText(`${index + 1}. ${character.name}`, character.x - 22, character.y + 38)
      context.restore()
    })
  }, [characters, currentCharacter])

  return (
    <div className="world-surface">
      <div className="world-status">
        <div>
          <p className="eyebrow">Live world state</p>
          <h2>Agents in world: {characters.length}</h2>
        </div>
        <p className="world-helper">
          {currentCharacter
            ? currentCharacter.status === 'pending'
              ? `${currentCharacter.name} is pending while the backend finishes image generation.`
              : `${currentCharacter.name} is the latest fully created agent on the canvas.`
            : '첫 번째 에이전트를 만들면 월드에 대기 상태가 먼저 표시됩니다.'}
        </p>
      </div>
      <canvas ref={canvasRef} width={1280} height={720} aria-label="2D world prototype canvas" />
      {characters.length > 0 ? (
        <ul className="world-roster" aria-label="World roster">
          {characters.map((character) => (
            <li key={character.id} className={character.status === 'pending' ? 'world-roster-pending' : undefined}>
              {character.imageUrl ? (
                <img className="world-roster-avatar" src={character.imageUrl} alt={`${character.name} generated avatar`} />
              ) : (
                <span className="world-roster-avatar world-roster-avatar-placeholder" aria-hidden="true">
                  …
                </span>
              )}
              <span className="world-roster-dot" style={{ backgroundColor: character.color }} aria-hidden="true" />
              {character.name} · {character.archetype}
              {character.status === 'pending' ? ' · pending' : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
