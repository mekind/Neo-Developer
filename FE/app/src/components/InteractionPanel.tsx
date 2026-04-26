import { useState } from 'react'

import type { WorldAgent, WorldPlayer } from '@/game/agents'

type InteractionPanelProps = {
  agents: WorldAgent[]
  isLoading: boolean
  errorMessage: string | null
  onCreateAgent: (personaSummary: string, backstoryPrompt: string) => Promise<void>
  player: WorldPlayer
}

export function InteractionPanel({ agents, isLoading, errorMessage, onCreateAgent, player }: InteractionPanelProps) {
  const [personaSummary, setPersonaSummary] = useState('')
  const [backstoryPrompt, setBackstoryPrompt] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedPersonaSummary = personaSummary.trim()
    const trimmedBackstoryPrompt = backstoryPrompt.trim()
    if (!trimmedPersonaSummary || !trimmedBackstoryPrompt) return

    try {
      setSubmitState('submitting')
      setSubmitError(null)
      await onCreateAgent(trimmedPersonaSummary, trimmedBackstoryPrompt)
      setPersonaSummary('')
      setBackstoryPrompt('')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create agent.')
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <section className="sidebar-content">
      <div className="sidebar-head">
        <p className="eyebrow">Room panel</p>
        <h2>Agents</h2>
      </div>

      <section className="panel-section panel-highlight" aria-label="Current player summary">
        <div className="panel-label-row">
          <span className="panel-kicker">Player</span>
          <span className="panel-count">1</span>
        </div>
        <p>
          <strong>{player.label}</strong> is the controllable user avatar.
        </p>
        <p>Move with WASD or arrow keys. Press E near an agent NPC to interact.</p>
      </section>

      <form className="panel-section creation-form" onSubmit={handleSubmit} aria-label="Add agent form">
        <div className="panel-label-row">
          <h3>Add agent</h3>
          <span className="panel-count">+</span>
        </div>

        <label className="field">
          <span>Persona</span>
          <input
            name="personaSummary"
            placeholder="Warm school guide"
            value={personaSummary}
            onChange={(event) => setPersonaSummary(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Backstory</span>
          <textarea
            name="backstoryPrompt"
            placeholder="Helps every newcomer settle in."
            rows={4}
            value={backstoryPrompt}
            onChange={(event) => setBackstoryPrompt(event.target.value)}
            required
          />
        </label>

        {submitError ? <p role="alert">{submitError}</p> : null}

        <button type="submit" disabled={submitState === 'submitting'}>
          {submitState === 'submitting' ? 'Adding…' : 'Add agent'}
        </button>
      </form>

      <section className="panel-section panel-highlight" aria-label="Backend agent summary">
        <div className="panel-label-row">
          <span className="panel-kicker">Status</span>
          <span className="panel-count">{agents.length}</span>
        </div>
        {isLoading ? <p>Loading backend agents…</p> : null}
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        {!isLoading && !errorMessage ? <p>{agents.length} agents ready.</p> : null}
      </section>

      <section className="panel-section" aria-label="Backend agent list">
        <div className="panel-label-row">
          <h3>Roster</h3>
          <span className="panel-count">{agents.length}</span>
        </div>

        {!isLoading && !errorMessage && agents.length > 0 ? (
          <ul className="agent-list" aria-label="Backend agent list">
            {agents.map((agent) => (
              <li key={agent.id}>
                <strong>{agent.label}</strong>
                <span>{agent.usesPlaceholder ? 'placeholder' : 'asset'}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading && !errorMessage && agents.length === 0 ? <p>No backend agents were returned.</p> : null}
      </section>
    </section>
  )
}
