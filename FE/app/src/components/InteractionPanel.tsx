import { useEffect, useId, useState } from 'react'

import { type WorldCharacter } from '@/game/characters'
import { listItems, type Item } from '@/services/items'

type InteractionPanelProps = {
  characters: WorldCharacter[]
  onCreateCharacter: (personaSummary: string, backstoryPrompt: string) => Promise<void>
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
  const dialogTitleId = useId()
  const dialogDescriptionId = useId()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [personaSummary, setPersonaSummary] = useState('')
  const [backstoryPrompt, setBackstoryPrompt] = useState('')
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

    const trimmedPersonaSummary = personaSummary.trim()
    const trimmedBackstoryPrompt = backstoryPrompt.trim()

    if (!trimmedPersonaSummary || !trimmedBackstoryPrompt || isCreatingAgent) return

    setIsDialogOpen(false)
    setPersonaSummary('')
    setBackstoryPrompt('')

    await onCreateCharacter(trimmedPersonaSummary, trimmedBackstoryPrompt)
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

      <div className="creation-form">
        <button type="button" onClick={() => setIsDialogOpen(true)} disabled={isCreatingAgent}>
          {isCreatingAgent ? 'Creating character…' : 'Open persona dialog'}
        </button>
        <p className="helper-copy">Submit persona data to the backend, then watch the main screen move from pending to ready.</p>
      </div>

      {createAgentError ? <p role="alert">{createAgentError}</p> : null}

      {isDialogOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <div
            className="dialog-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Agent creation</p>
                <h3 id={dialogTitleId}>Create persona character</h3>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsDialogOpen(false)}
                disabled={isCreatingAgent}
              >
                Close
              </button>
            </div>

            <p id={dialogDescriptionId} className="dialog-copy">
              Submit a short persona summary plus a longer backstory prompt. The main screen will show a pending
              placeholder until backend image generation finishes.
            </p>

            <form className="creation-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Persona summary</span>
                <input
                  name="personaSummary"
                  placeholder="e.g. Warm school guide who helps newcomers feel at home"
                  value={personaSummary}
                  onChange={(event) => setPersonaSummary(event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Backstory / prompt</span>
                <textarea
                  name="backstoryPrompt"
                  placeholder="Describe how this agent behaves, speaks, and supports the shared world."
                  value={backstoryPrompt}
                  onChange={(event) => setBackstoryPrompt(event.target.value)}
                  rows={5}
                  required
                />
              </label>

              <div className="dialog-actions">
                <button type="submit" disabled={isCreatingAgent}>
                  {isCreatingAgent ? 'Submitting…' : 'Create character'}
                </button>
              </div>
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
