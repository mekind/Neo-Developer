import { useEffect, useState } from 'react'

import { archetypeOptions, type CharacterArchetype, type WorldCharacter } from '@/game/characters'
import { listItems, type Item } from '@/services/items'

type InteractionPanelProps = {
  characters: WorldCharacter[]
  onCreateCharacter: (name: string, archetype: CharacterArchetype) => Promise<void>
  isCreatingAgent: boolean
  createAgentError: string | null
}

const futureActions = [
  '좌측 사이드바에 상태/채팅/유저 목록 배치 가능',
  '월드 상호작용 UI는 오버레이로 확장 가능',
  '실시간 기능은 이후 단계에서 연결',
]

export function InteractionPanel({
  characters,
  onCreateCharacter,
  isCreatingAgent,
  createAgentError,
}: InteractionPanelProps) {
  const [name, setName] = useState('')
  const [archetype, setArchetype] = useState<CharacterArchetype>('scout')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName || isCreatingAgent) return

    setIsDialogOpen(false)
    setName('')

    await onCreateCharacter(trimmedName, archetype)
  }

  const currentCharacter = characters.at(-1)

  return (
    <section>
      <p className="section-label">interaction guide</p>
      <h2>낯설지 않게 시작하는 안내</h2>
      <p>
        복잡한 기능을 먼저 강조하기보다, 사용자가 지금 무엇을 하면 되는지 편하게 이해할 수 있는 흐름을
        우선합니다.
      </p>

      <div className="creation-panel-actions">
        <button type="button" onClick={() => setIsDialogOpen(true)} disabled={isCreatingAgent}>
          {isCreatingAgent ? 'Creating agent…' : 'Create agent'}
        </button>
        <p className="helper-copy">폼 다이얼로그에서 생성 요청을 보내고, 메인 화면에서 진행 상태를 확인합니다.</p>
      </div>

      {createAgentError ? <p role="alert">{createAgentError}</p> : null}

      {isDialogOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog-shell" role="dialog" aria-modal="true" aria-labelledby="create-agent-title">
            <div className="dialog-header">
              <div>
                <p className="section-label">new agent</p>
                <h3 id="create-agent-title">Create an agent</h3>
              </div>
              <button type="button" className="secondary-button" onClick={() => setIsDialogOpen(false)}>
                Close
              </button>
            </div>

            <form className="creation-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Agent name</span>
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

              <button type="submit" disabled={isCreatingAgent}>
                {isCreatingAgent ? 'Creating…' : 'Submit to backend'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <section className="panel-section" aria-label="Current character summary">
        <h3>Current world agent</h3>
        {currentCharacter ? (
          currentCharacter.status === 'pending' ? (
            <p>
              <strong>{currentCharacter.name}</strong> is pending as a {currentCharacter.archetype}. Backend image
              generation is still running.
            </p>
          ) : (
            <p>
              <strong>{currentCharacter.name}</strong> joined as a {currentCharacter.archetype}.
            </p>
          )
        ) : (
          <p>아직 생성된 에이전트가 없습니다.</p>
        )}
      </section>

      <section className="panel-section" aria-label="Spawned character list">
        <h3>Agents on the main screen</h3>
        {characters.length > 0 ? (
          <ul className="action-list">
            {characters.map((character) => (
              <li key={character.id}>
                {character.name} · {character.archetype}
                {character.status === 'pending' ? ' · pending image generation' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>에이전트를 만들면 메인 화면에 대기 상태가 먼저 보이고, 완료 후 정식으로 반영됩니다.</p>
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
