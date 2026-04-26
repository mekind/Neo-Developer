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
      setSubmitError(error instanceof Error ? error.message : '에이전트 생성에 실패했습니다.')
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="add-agent-dialog-title">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">에이전트 추가</p>
            <h3 id="add-agent-dialog-title">에이전트 추가</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onClose} disabled={submitState === 'submitting'}>
            닫기
          </button>
        </div>

        <form className="creation-form" onSubmit={handleSubmit} aria-label="에이전트 추가 폼">
          <label className="field">
            <span>페르소나</span>
            <input
              name="personaSummary"
              placeholder="따뜻하게 안내해주는 학교 가이드"
              value={personaSummary}
              onChange={(event) => setPersonaSummary(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>배경 설명</span>
            <textarea
              name="backstoryPrompt"
              placeholder="처음 온 사용자가 편하게 적응하도록 돕습니다."
              rows={4}
              value={backstoryPrompt}
              onChange={(event) => setBackstoryPrompt(event.target.value)}
              required
            />
          </label>

          {submitError ? <p role="alert">{submitError}</p> : null}

          <button type="submit" disabled={submitState === 'submitting'}>
            {submitState === 'submitting' ? '추가 중…' : '에이전트 추가'}
          </button>
        </form>
      </div>
    </div>
  )
}
