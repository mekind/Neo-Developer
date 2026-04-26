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

    context.fillStyle = '#f8fafc'
    context.font = '16px sans-serif'
    context.fillText('World prototype', 24, 32)
    context.fillText('Characters appear here as soon as the panel creates them', 24, 56)

    if (characters.length === 0) {
      context.fillStyle = 'rgba(148, 163, 184, 0.9)'
      context.font = '18px sans-serif'
      context.fillText('No spawned characters yet', 24, 96)
      return
    }

    if (typeof context.arc !== 'function') return

    characters.forEach((character, index) => {
      context.fillStyle = character.color
      context.beginPath()
      context.arc(character.x, character.y, 18, 0, Math.PI * 2)
      context.fill()

      context.strokeStyle = currentCharacter?.id === character.id ? '#f8fafc' : 'rgba(226,232,240,0.45)'
      context.lineWidth = currentCharacter?.id === character.id ? 3 : 1
      context.stroke()

      context.fillStyle = '#f8fafc'
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
      <canvas ref={canvasRef} width={720} height={480} aria-label="2D world prototype canvas" />
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
