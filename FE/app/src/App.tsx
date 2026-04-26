import { InteractionPanel } from '@/components/InteractionPanel'
import { archetypeOptions, type CharacterArchetype, type WorldCharacter } from '@/game/characters'
import { WorldCanvas } from '@/game/WorldCanvas'
import { useMemo, useState } from 'react'

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
          x: 160 + (index % 4) * 110,
          y: 150 + Math.floor(index / 4) * 90,
        }
      })(),
    ])
  }

  const currentCharacter = useMemo(() => characters.at(-1) ?? null, [characters])

  return (
    <main className="app-shell">
      <section className="world-column">
        <header className="world-header">
          <p className="eyebrow">FE bootstrap</p>
          <h1>Gather-like Frontend Starter</h1>
          <p className="description">
            Prototype the panel-to-world creation flow before movement, persistence, or realtime systems exist.
          </p>
        </header>
        <WorldCanvas characters={characters} currentCharacter={currentCharacter} />
      </section>

      <aside className="side-column">
        <InteractionPanel characters={characters} onCreateCharacter={handleCreateCharacter} />
      </aside>
    </main>
  )
}
