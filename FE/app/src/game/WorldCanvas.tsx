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
    wallGradient.addColorStop(0, '#f6ead8')
    wallGradient.addColorStop(0.5, '#efe0c7')
    wallGradient.addColorStop(1, '#e0c39e')
    context.fillStyle = wallGradient
    context.fillRect(0, 0, width, height)

    context.fillStyle = '#d6a977'
    context.fillRect(0, height - 170, width, 170)

    context.fillStyle = '#b98554'
    for (let x = 0; x < width; x += 64) {
      context.fillRect(x, height - 170, 4, 170)
    }

    context.fillStyle = '#8b5e3c'
    context.fillRect(56, 72, width - 112, 22)

    const windows = [150, 390, 630, 870]
    windows.forEach((x) => {
      context.fillStyle = '#91613d'
      context.fillRect(x, 104, 150, 168)
      context.fillStyle = '#b9e3f8'
      context.fillRect(x + 12, 116, 126, 144)
      context.strokeStyle = 'rgba(255,255,255,0.45)'
      context.lineWidth = 4
      context.beginPath()
      context.moveTo(x + 75, 116)
      context.lineTo(x + 75, 260)
      context.moveTo(x + 12, 188)
      context.lineTo(x + 138, 188)
      context.stroke()
    })

    context.fillStyle = '#6c8f5f'
    context.fillRect(1020, 124, 38, 118)
    context.beginPath()
    context.arc(1039, 104, 42, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#c99b64'
    context.fillRect(176, 342, 220, 86)
    context.fillRect(480, 360, 250, 96)
    context.fillRect(834, 334, 200, 82)

    context.fillStyle = '#8a5b39'
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

    context.fillStyle = '#f4d06f'
    context.beginPath()
    context.arc(1116, 124, 28, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = 'rgba(244, 208, 111, 0.18)'
    context.beginPath()
    context.arc(1116, 124, 78, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#5b4636'
    context.font = 'bold 18px sans-serif'
    context.fillText('Warm school commons prototype', 28, 42)
    context.font = '16px sans-serif'
    context.fillText('새 캐릭터가 따뜻한 학교 분위기의 월드에 바로 배치됩니다.', 28, 68)

    if (characters.length === 0) {
      context.fillStyle = 'rgba(91, 70, 54, 0.72)'
      context.font = '18px sans-serif'
      context.fillText('No spawned characters yet', 28, 120)
      return
    }

    characters.forEach((character, index) => {
      context.fillStyle = character.color
      context.beginPath()
      context.arc(character.x, character.y, 18, 0, Math.PI * 2)
      context.fill()

      context.strokeStyle = currentCharacter?.id === character.id ? '#fff7ed' : 'rgba(91,70,54,0.45)'
      context.lineWidth = currentCharacter?.id === character.id ? 3 : 1
      context.stroke()

      context.fillStyle = '#5b4636'
      context.font = '14px sans-serif'
      context.fillText(`${index + 1}. ${character.name}`, character.x - 22, character.y + 38)
    })
  }, [characters, currentCharacter])

  return (
    <div className="world-surface">
      <div className="world-status">
        <div>
          <p className="eyebrow">Live world state</p>
          <h2>Spawned avatars: {characters.length}</h2>
        </div>
        <p className="world-helper">
          {currentCharacter
            ? `${currentCharacter.name} is the latest character added to the canvas.`
            : 'Submit the form to create the first prototype avatar.'}
        </p>
      </div>
      <canvas ref={canvasRef} width={1280} height={720} aria-label="2D world prototype canvas" />
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
