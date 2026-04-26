import { useEffect, useId, useState } from 'react'

import { type WorldCharacter } from '@/game/characters'
import { listItems, type Item } from '@/services/items'

type InteractionPanelProps = {
  characters: WorldCharacter[]
  onCreateCharacter: (personaSummary: string, backstoryPrompt: string) => Promise<void>
}

export function InteractionPanel({ characters, onCreateCharacter }: InteractionPanelProps) {
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

  const currentCharacter = characters.at(-1)

  return (
    <section className="sidebar-content">
      <div className="sidebar-head">
        <p className="eyebrow">Room panel</p>
        <h2>Agents</h2>
      </div>

      <div className="creation-form compact-creation-card">
        <button type="button" onClick={() => setIsDialogOpen(true)}>
          Open persona dialog
        </button>
        <p className="helper-copy">Create once, spawn instantly.</p>
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
                <h3 id={dialogTitleId}>Create persona</h3>
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
              Submit a summary and backstory prompt.
            </p>

            <form className="creation-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Persona summary</span>
                <input
                  name="personaSummary"
                  placeholder="Warm school guide"
                  value={personaSummary}
                  onChange={(event) => setPersonaSummary(event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Backstory / prompt</span>
                <textarea
                  name="backstoryPrompt"
                  placeholder="Helps every newcomer settle in."
                  value={backstoryPrompt}
                  onChange={(event) => setBackstoryPrompt(event.target.value)}
                  rows={5}
                  required
                />
              </label>

              {submitError ? <p role="alert">{submitError}</p> : null}

              <div className="dialog-actions">
                <button type="submit" disabled={submitState === 'submitting'}>
                  {submitState === 'submitting' ? 'Creating…' : 'Create character'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
          <h3 id={dialogTitleId + '-items'}>Items</h3>
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
