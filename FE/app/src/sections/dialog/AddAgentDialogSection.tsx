import { useEffect, useState } from 'react'

type AddAgentDialogSectionProps = {
  isOpen: boolean
  onClose: () => void
  onCreateAgent: (name: string, persona: string) => Promise<void>
}

const nameLeft = ['Warm', 'Sunny', 'Kind', 'Brave', 'Calm', 'Bright']
const nameRight = ['Guide', 'Buddy', 'Helper', 'Scout', 'Friend', 'Keeper']

function createRandomAgentName() {
  const left = nameLeft[Math.floor(Math.random() * nameLeft.length)]
  const right = nameRight[Math.floor(Math.random() * nameRight.length)]
  return `${left} ${right}`
}

export function AddAgentDialogSection({ isOpen, onClose, onCreateAgent }: AddAgentDialogSectionProps) {
  const [name, setName] = useState('')
  const [persona, setPersona] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setName(createRandomAgentName())
    setPersona('')
    setSubmitError(null)
    setSubmitState('idle')
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedPersona = persona.trim()
    if (!trimmedName || !trimmedPersona) return

    try {
      setSubmitState('submitting')
      setSubmitError(null)
      await onCreateAgent(trimmedName, trimmedPersona)
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
            <p className="eyebrow">NPC dialog</p>
            <h3 id="add-agent-dialog-title">Add agent NPC</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onClose} disabled={submitState === 'submitting'}>
            Close
          </button>
        </div>

        <form className="creation-form" onSubmit={handleSubmit} aria-label="Add agent form">
          <label className="field">
            <span>Name</span>
            <input name="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label className="field">
            <span>Persona</span>
            <textarea
              name="persona"
              placeholder="Warm school guide who helps newcomers feel at home."
              rows={4}
              value={persona}
              onChange={(event) => setPersona(event.target.value)}
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
