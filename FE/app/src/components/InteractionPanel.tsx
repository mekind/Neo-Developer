import { useEffect, useState } from 'react'

import { archetypeOptions, type CharacterArchetype, type WorldCharacter } from '@/game/characters'
import { listItems, type Item } from '@/services/items'

type InteractionPanelProps = {
  characters: WorldCharacter[]
  onCreateCharacter: (name: string, archetype: CharacterArchetype) => void
}

const futureActions = [
  '좌측 사이드바에 상태/채팅/유저 목록 배치 가능',
  '월드 상호작용 UI는 오버레이로 확장 가능',
  '실시간 기능은 이후 단계에서 연결',
]

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
        if (isMounted) {
          setItems(nextItems)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load items.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
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
    <section>
      <h2>Sidebar UI Placeholder</h2>
      <p>Gather-like 레이아웃 기준으로 보조 정보와 캐릭터 생성 컨트롤이 이 영역에 들어갑니다.</p>

      <form className="creation-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Character name</span>
          <input
            name="name"
            placeholder="e.g. Nova"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Archetype</span>
          <select value={archetype} onChange={(event) => setArchetype(event.target.value as CharacterArchetype)}>
            {archetypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit">Create character</button>
      </form>

      <section className="panel-section" aria-label="Current character summary">
        <h3>Current world character</h3>
        {currentCharacter ? (
          <p>
            <strong>{currentCharacter.name}</strong> joined as a {currentCharacter.archetype}.
          </p>
        ) : (
          <p>No characters created yet.</p>
        )}
      </section>

      <section className="panel-section" aria-label="Spawned character list">
        <h3>Spawned characters</h3>
        {characters.length > 0 ? (
          <ul className="action-list">
            {characters.map((character) => (
              <li key={character.id}>
                {character.name} · {character.archetype}
              </li>
            ))}
          </ul>
        ) : (
          <p>Each submission appends another prototype avatar to the world.</p>
        )}
      </section>

      <ul className="action-list muted-list">
        {futureActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>

      <section className="panel-section" aria-labelledby="live-items-title">
        <h3 id="live-items-title">Live items</h3>
        <p>Backend source: configurable Vite API base URL + typed items service.</p>

        {isLoading ? <p>Loading live items…</p> : null}
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}

        {!isLoading && !errorMessage ? (
          <ul className="action-list" aria-label="Live items list">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                {item.description ? ` — ${item.description}` : ''} ({item.price.toLocaleString()} KRW)
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  )
}
