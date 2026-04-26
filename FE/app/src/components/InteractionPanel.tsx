import { useEffect, useId, useState } from 'react'

import { type WorldCharacter } from '@/game/characters'
import { listItems, type Item } from '@/services/items'

type InteractionPanelProps = {
  characters: WorldCharacter[]
  playerCharacter: WorldCharacter
  onCreateCharacter: (personaSummary: string, backstoryPrompt: string) => Promise<void>
}

const futureActions = [
  '좌측 사이드바에 상태/채팅/유저 목록 배치 가능',
  '월드 상호작용 UI는 오버레이로 확장 가능',
  '실시간 기능은 이후 단계에서 연결',
]

export function InteractionPanel({ characters, playerCharacter, onCreateCharacter }: InteractionPanelProps) {
  const dialogTitleId = useId()
  const dialogDescriptionId = useId()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [personaSummary, setPersonaSummary] = useState('')
  const [backstoryPrompt, setBackstoryPrompt] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
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

    if (!trimmedPersonaSummary || !trimmedBackstoryPrompt) return

    try {
      setSubmitState('submitting')
      setSubmitError(null)
      await onCreateCharacter(trimmedPersonaSummary, trimmedBackstoryPrompt)
      setPersonaSummary('')
      setBackstoryPrompt('')
      setIsDialogOpen(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create agent character.')
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <section>
      <p className="section-label">interaction guide</p>
      <h2>낯설지 않게 시작하는 안내</h2>
      <p>
        사용자는 입장하자마자 자기 아바타를 움직일 수 있고, 복잡한 기능보다 지금 무엇을 할 수 있는지 먼저
        이해하도록 흐름을 단순하게 유지합니다.
      </p>

      <div className="creation-form">
        <button type="button" onClick={() => setIsDialogOpen(true)}>
          Open agent dialog
        </button>
        <p className="helper-copy">Agent API로 받은 NPC를 월드에 추가하는 흐름입니다. 플레이어 아바타는 따로 유지됩니다.</p>
      </div>

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
                <h3 id={dialogTitleId}>Create agent NPC</h3>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitState === 'submitting'}
              >
                Close
              </button>
            </div>

            <p id={dialogDescriptionId} className="dialog-copy">
              Submit a short persona summary plus a longer backstory prompt, then spawn the returned agent NPC into the
              world while the user avatar stays under player control.
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

              {submitError ? <p role="alert">{submitError}</p> : null}

              <div className="dialog-actions">
                <button type="submit" disabled={submitState === 'submitting'}>
                  {submitState === 'submitting' ? 'Creating agent…' : 'Create agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section className="panel-section" aria-label="Current character summary">
        <h3>Current player</h3>
        <p>
          <strong>{playerCharacter.name}</strong> is the controllable user avatar.
        </p>
      </section>

      <section className="panel-section" aria-label="Spawned character list">
        <h3>Agent NPC roster</h3>
        {characters.length > 0 ? (
          <ul className="action-list">
            {characters.map((character) => (
              <li key={character.id}>
                {character.name} · {character.archetype}
              </li>
            ))}
          </ul>
        ) : (
          <p>백엔드 agent API가 비어 있으면 아직 NPC가 없는 상태로 시작합니다.</p>
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
