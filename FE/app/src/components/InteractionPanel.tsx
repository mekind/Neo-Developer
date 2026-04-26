import { useEffect, useState } from 'react'

import { archetypeOptions, type CharacterArchetype, type WorldCharacter } from '@/game/characters'
import { listItems, type Item } from '@/services/items'

type InteractionPanelProps = {
  characters: WorldCharacter[]
  onCreateCharacter: (name: string, archetype: CharacterArchetype) => void
}

export function InteractionPanel({ characters, onCreateCharacter }: InteractionPanelProps) {
  const [name, setName] = useState('')
  const [archetype, setArchetype] = useState<CharacterArchetype>('scout')
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const nextItems = await listItems()
        if (isMounted) setItems(nextItems)
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load items.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadItems()
    return () => {
      isMounted = false
    }
  }, [])

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
          <p>아직 에이전트가 없습니다.</p>
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
          <p>참여한 에이전트가 여기에 표시됩니다.</p>
        )}
      </section>

      <section className="panel-section" aria-labelledby="live-items-title">
        <div className="panel-label-row">
          <h3 id="live-items-title">Items</h3>
          <span className="panel-count">{items.length}</span>
        </div>

        {isLoading ? <p>Loading items…</p> : null}
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}

        {!isLoading && !errorMessage ? (
          <ul className="agent-list" aria-label="Live items list">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.price.toLocaleString()} KRW</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  )
}
