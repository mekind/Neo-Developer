import { useState } from 'react'

import { archetypeOptions, type CharacterArchetype, type WorldCharacter } from '@/game/characters'

type InteractionPanelProps = {
  characters: WorldCharacter[]
  onCreateCharacter: (name: string, archetype: CharacterArchetype) => void
}

export function InteractionPanel({ characters, onCreateCharacter }: InteractionPanelProps) {
  const [name, setName] = useState('')
  const [archetype, setArchetype] = useState<CharacterArchetype>('scout')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) return

    onCreateCharacter(trimmedName, archetype)
    setName('')
  }

  const currentCharacter = characters.at(-1)

  return (
    <section className="sidebar-content">
      <div className="sidebar-head">
        <p className="eyebrow">Room panel</p>
        <h2>Agents</h2>
      </div>

      <form className="creation-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input
            name="name"
            placeholder="Nova"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Role</span>
          <select value={archetype} onChange={(event) => setArchetype(event.target.value as CharacterArchetype)}>
            {archetypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit">Add agent</button>
      </form>

      <section className="panel-section panel-highlight" aria-label="Current character summary">
        <div className="panel-label-row">
          <span className="panel-kicker">Now</span>
          <span className="panel-count">{characters.length}</span>
        </div>
        {currentCharacter ? (
          <p>
            <strong>{currentCharacter.name}</strong>
            <span>{currentCharacter.archetype}</span>
          </p>
        ) : (
          <p>Waiting for the first agent.</p>
        )}
      </section>

      <section className="panel-section" aria-label="Agent list">
        <div className="panel-label-row">
          <h3>Roster</h3>
          <span className="panel-count">{characters.length}</span>
        </div>
        {characters.length > 0 ? (
          <ul className="agent-list">
            {characters.map((character) => (
              <li key={character.id}>
                <strong>{character.name}</strong>
                <span>{character.archetype}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Agents appear here as soon as they join.</p>
        )}
      </section>
    </section>
  )
}
