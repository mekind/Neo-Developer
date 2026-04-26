import { useEffect, useMemo, useRef, useState } from 'react'

import type { WorldAgent } from '@/game/agents'
import type { LpcFrameMap, LpcSpriteCatalog } from '@/game/lpcSprite'

type ChatMessage = {
  id: string
  role: 'user' | 'agent'
  text: string
  meta?: string
}

type AgentChatDialogSectionProps = {
  agent: WorldAgent | null
  isOpen: boolean
  lpcSpriteCatalog: LpcSpriteCatalog
  onClose: () => void
  messages: ChatMessage[]
  isSubmitting: boolean
  errorMessage: string | null
  onSendMessage: (message: string) => Promise<void>
}

type PortraitSprite = {
  src: string
  frameMap: LpcFrameMap
}

const starterPrompts = ['오늘 일정 알려줘', '이 공간 설명해줘', '처음 온 사람에게 팁 있어?']
const CHAT_AVATAR_SIZE = 64

function resolvePortraitSprite(agent: WorldAgent, lpcSpriteCatalog: LpcSpriteCatalog): PortraitSprite | null {
  if (agent.apiSprite) {
    return {
      src: agent.apiSprite.characterPngUrl,
      frameMap: agent.apiSprite.frameMap,
    }
  }

  if (!agent.spriteBundleId) return null
  const bundle = lpcSpriteCatalog[agent.spriteBundleId]
  if (!bundle) return null

  return {
    src: bundle.characterPngUrl,
    frameMap: bundle.frameMap,
  }
}

function SpritePortrait({ agent, portraitSprite }: { agent: WorldAgent; portraitSprite: PortraitSprite }) {
  const idleAnimation = portraitSprite.frameMap.animations.walk_s
  const frameIndex = idleAnimation.frames[0] ?? 0
  const scale = CHAT_AVATAR_SIZE / portraitSprite.frameMap.frameSize
  const offsetX = frameIndex * portraitSprite.frameMap.frameSize
  const offsetY = idleAnimation.y

  return (
    <div className="chat-agent-avatar-sprite-shell" role="img" aria-label={`${agent.label} 아바타`}>
      <img
        src={portraitSprite.src}
        alt=""
        aria-hidden="true"
        className="chat-agent-avatar-sprite"
        style={{
          transform: `translate(${-offsetX * scale}px, ${-offsetY * scale}px) scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  )
}

export function AgentChatDialogSection({
  agent,
  isOpen,
  lpcSpriteCatalog,
  onClose,
  messages,
  isSubmitting,
  errorMessage,
  onSendMessage,
}: AgentChatDialogSectionProps) {
  const [draft, setDraft] = useState('')
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const isComposingRef = useRef(false)

  const portraitSprite = useMemo(() => {
    if (!agent) return null
    return resolvePortraitSprite(agent, lpcSpriteCatalog)
  }, [agent, lpcSpriteCatalog])

  useEffect(() => {
    const node = transcriptRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setDraft('')
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !agent) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return

    await onSendMessage(trimmed)
    setDraft('')
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="chat-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="npc-chat-title">
        <header className="dialog-header chat-dialog-header">
          <div className="chat-dialog-title-wrap">
            <p className="eyebrow">NPC 대화</p>
            <h3 id="npc-chat-title">{agent.label}와 대화하기</h3>
            <p className="chat-dialog-subtitle">백엔드 invoke API와 연결된 대화창입니다.</p>
          </div>
          <button type="button" className="secondary-button" onClick={onClose} disabled={isSubmitting}>
            닫기
          </button>
        </header>

        <section className="chat-agent-summary" aria-label="NPC 요약 카드">
          <div className="chat-agent-avatar-shell">
            {portraitSprite ? (
              <SpritePortrait agent={agent} portraitSprite={portraitSprite} />
            ) : (
              <img src={agent.imageSrc} alt={`${agent.label} 아바타`} className="chat-agent-avatar" />
            )}
          </div>
          <div className="chat-agent-meta">
            <strong>{agent.label}</strong>
            <span>{agent.personaSummary ?? '아직 등록된 페르소나 요약이 없습니다.'}</span>
          </div>
          <span className="chat-agent-status">{isSubmitting ? '응답 중' : '대기 중'}</span>
        </section>

        <div ref={transcriptRef} className="chat-transcript" aria-label="NPC 대화 내용">
          <div className="chat-transcript-stack">
            {messages.length === 0 ? (
              <article className="chat-bubble chat-bubble-agent chat-bubble-muted">
                <span className="chat-bubble-speaker">{agent.label}</span>
                <p>첫 메시지를 보내면 백엔드에서 응답을 받아와 여기에 표시합니다.</p>
              </article>
            ) : null}

            {messages.map((message) => (
              <article key={message.id} className={`chat-bubble ${message.role === 'agent' ? 'chat-bubble-agent' : 'chat-bubble-user'}`}>
                <span className="chat-bubble-speaker">{message.role === 'agent' ? agent.label : '나'}</span>
                <p>{message.text}</p>
                {message.meta ? <small>{message.meta}</small> : null}
              </article>
            ))}
          </div>
        </div>

        <section className="chat-starter-prompts" aria-label="추천 질문">
          {starterPrompts.map((prompt) => (
            <button key={prompt} type="button" className="chat-prompt-chip" onClick={() => setDraft(prompt)} disabled={isSubmitting}>
              {prompt}
            </button>
          ))}
        </section>

        <form ref={formRef} className="chat-composer" onSubmit={handleSubmit} aria-label="NPC 대화 입력창">
          <label className="field chat-composer-field">
            <span>메시지</span>
            <div className="chat-composer-row">
              <textarea
                name="message"
                rows={4}
                placeholder="메시지를 입력하세요"
                value={draft}
                disabled={isSubmitting}
                onChange={(event) => setDraft(event.target.value)}
                onCompositionStart={() => {
                  isComposingRef.current = true
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    if (isComposingRef.current || event.nativeEvent.isComposing) return
                    event.preventDefault()
                    formRef.current?.requestSubmit()
                  }
                }}
              />
              <button type="submit" className="chat-send-button" disabled={!draft.trim() || isSubmitting}>
                {isSubmitting ? '보내는 중…' : '보내기'}
              </button>
            </div>
            {errorMessage ? <p role="alert">{errorMessage}</p> : null}
          </label>
        </form>
      </section>
    </div>
  )
}
