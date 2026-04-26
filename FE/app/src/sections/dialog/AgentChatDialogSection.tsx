import { useEffect, useMemo, useRef, useState } from 'react'

import type { WorldAgent } from '@/game/agents'

type AgentChatDialogSectionProps = {
  agent: WorldAgent | null
  isOpen: boolean
  onClose: () => void
}

type ChatMessage = {
  id: string
  speaker: 'agent' | 'user'
  text: string
}

const starterPrompts = ['오늘 일정 알려줘', '이 공간 설명해줘', '처음 온 사람에게 팁 있어?']

function buildNpcGreeting(agent: WorldAgent) {
  return agent.usesPlaceholder
    ? `${agent.label}: 아직 준비 중인 정보가 조금 있지만, 여기서 바로 대화를 시작할 수 있어요.`
    : `${agent.label}: 반가워요. 스쿨 커먼즈에서 필요한 일이 있으면 편하게 말씀해 주세요.`
}

function buildNpcReply(agent: WorldAgent, message: string) {
  if (/일정|schedule/i.test(message)) {
    return `${agent.label}: 오늘 일정은 곧 이 대화창에서 바로 확인할 수 있게 연결할 예정이에요.`
  }

  if (/설명|공간|room|commons/i.test(message)) {
    return `${agent.label}: 이곳은 사람들과 에이전트가 함께 머무는 공용 공간이에요. 필요한 정보는 여기서 계속 이어서 안내할게요.`
  }

  if (/팁|tip|처음/i.test(message)) {
    return `${agent.label}: 처음에는 주변 에이전트와 가볍게 대화를 시작하고, 필요한 작업은 하나씩 요청하는 방식이 가장 편해요.`
  }

  return `${agent.label}: 좋은 질문이에요. 이 대화 인터페이스가 backend와 연결되면 더 자연스럽게 이어서 답변해 드릴게요.`
}

export function AgentChatDialogSection({ agent, isOpen, onClose }: AgentChatDialogSectionProps) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const isComposingRef = useRef(false)

  const seededMessages = useMemo<ChatMessage[]>(() => {
    if (!agent) return []
    return [
      {
        id: `greeting-${agent.id}`,
        speaker: 'agent',
        text: buildNpcGreeting(agent),
      },
    ]
  }, [agent])

  const transcript = messages.length > 0 ? messages : seededMessages

  useEffect(() => {
    const node = transcriptRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [transcript, isOpen])


  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !agent) return null

  const submitMessage = () => {
    const trimmed = draft.trim()
    if (!trimmed) return

    const now = Date.now()
    const userMessage: ChatMessage = {
      id: `user-${now}`,
      speaker: 'user',
      text: trimmed,
    }
    const agentReply: ChatMessage = {
      id: `agent-${now + 1}`,
      speaker: 'agent',
      text: buildNpcReply(agent, trimmed),
    }

    setMessages((current) => [...current, userMessage, agentReply])
    setDraft('')
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="chat-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="npc-chat-title">
        <header className="dialog-header chat-dialog-header">
          <div className="chat-dialog-title-wrap">
            <p className="eyebrow">NPC 대화</p>
            <h3 id="npc-chat-title">{agent.label}와 대화하기</h3>
            <p className="chat-dialog-subtitle">필요한 내용을 바로 묻고 답을 이어가세요.</p>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            닫기
          </button>
        </header>

        <section className="chat-agent-summary" aria-label="NPC 요약 카드">
          <div className="chat-agent-avatar-shell">
            <img src={agent.imageSrc} alt={`${agent.label} 아바타`} className="chat-agent-avatar" />
          </div>
          <div className="chat-agent-meta">
            <strong>{agent.label}</strong>
            <span>{agent.usesPlaceholder ? '기본 프로필 이미지 사용 중' : '프로필 이미지 연결됨'}</span>
          </div>
          <span className="chat-agent-status">온라인</span>
        </section>

        <div ref={transcriptRef} className="chat-transcript" aria-label="NPC 대화 내용">
          <div className="chat-transcript-stack">
            {transcript.map((message) => (
              <article
                key={message.id}
                className={`chat-bubble ${message.speaker === 'agent' ? 'chat-bubble-agent' : 'chat-bubble-user'}`}
              >
                <span className="chat-bubble-speaker">{message.speaker === 'agent' ? agent.label : '나'}</span>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
        </div>

        <section className="chat-starter-prompts" aria-label="추천 질문">
          {starterPrompts.map((prompt) => (
            <button key={prompt} type="button" className="chat-prompt-chip" onClick={() => setDraft(prompt)}>
              {prompt}
            </button>
          ))}
        </section>

        <form
          ref={formRef}
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault()
            submitMessage()
          }}
          aria-label="NPC 대화 입력창"
        >
          <label className="field chat-composer-field">
            <span>메시지</span>
            <div className="chat-composer-row">
              <textarea
                name="message"
                rows={4}
                placeholder="메시지를 입력하세요"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onCompositionStart={() => {
                  isComposingRef.current = true
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    if (isComposingRef.current || event.nativeEvent.isComposing) {
                      return
                    }

                    event.preventDefault()
                    formRef.current?.requestSubmit()
                  }
                }}
              />
              <button type="submit" className="chat-send-button" disabled={!draft.trim()}>
                보내기
              </button>
            </div>
          </label>
        </form>
      </section>
    </div>
  )
}
