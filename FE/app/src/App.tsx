import { useMemo, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import { archetypeOptions, type CharacterArchetype, type WorldCharacter } from '@/game/characters'
import { WorldCanvas } from '@/game/WorldCanvas'

export default function App() {
  const [characters, setCharacters] = useState<WorldCharacter[]>([])

  const handleCreateCharacter = (name: string, archetype: CharacterArchetype) => {
    setCharacters((current) => [
      ...current,
      (() => {
        const palette = archetypeOptions.find((option) => option.value === archetype) ?? archetypeOptions[0]
        const index = current.length

        return {
          id: `${name}-${index + 1}`,
          name,
          archetype,
          color: palette.color,
          x: 160 + (index % 4) * 180,
          y: 180 + Math.floor(index / 4) * 110,
        }
      })(),
    ])
  }

  const currentCharacter = useMemo(() => characters.at(-1) ?? null, [characters])

  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">Neo Commons</p>
          <h1>School Commons</h1>
        </div>
        <div className="topbar-summary" aria-label="Room summary">
          <span className="status-pill">Live</span>
          <strong>{characters.length}</strong>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar panel-shell">
          <InteractionPanel characters={characters} onCreateCharacter={handleCreateCharacter} />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">Room</p>
            <h2>Commons Floor</h2>
          </div>
          <WorldCanvas characters={characters} currentCharacter={currentCharacter} />
        </section>
      </div>
    </main>
  )
}
