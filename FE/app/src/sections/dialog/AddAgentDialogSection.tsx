import { useState } from 'react'

type AddAgentDialogSectionProps = {
  isOpen: boolean
  onClose: () => void
  onCreateAgent: (personaSummary: string, backstoryPrompt: string) => Promise<void>
}

export function AddAgentDialogSection({ isOpen, onClose, onCreateAgent }: AddAgentDialogSectionProps) {
  const [personaSummary, setPersonaSummary] = useState('')
  const [backstoryPrompt, setBackstoryPrompt] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!isOpen) return null

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
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create agent.')
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="add-agent-dialog-title">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Agent dialog</p>
            <h3 id="add-agent-dialog-title">Add agent</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onClose} disabled={submitState === 'submitting'}>
            Close
          </button>
        </div>

        <form className="creation-form" onSubmit={handleSubmit} aria-label="Add agent form">
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
      </div>
    </div>
  )
}
