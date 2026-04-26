import { useState } from 'react'

import type { WorldAgent } from '@/game/agents'

type AgentChatDialogSectionProps = {
  agent: WorldAgent | null
  isOpen: boolean
  onClose: () => void
}

const starterPrompts = ['오늘 일정 알려줘', '이 공간 설명해줘', '처음 온 사람에게 팁 있어?']

function buildNpcGreeting(agent: WorldAgent) {
  return agent.usesPlaceholder
    ? `${agent.label}: 아직 프로필 이미지는 임시 상태지만, 여기서 바로 대화를 이어갈 수 있어요.`
    : `${agent.label}: 스쿨 커먼즈에 온 걸 환영해요. 무엇을 도와드릴까요?`
}

export function AgentChatDialogSection({ agent, isOpen, onClose }: AgentChatDialogSectionProps) {
  const [draft, setDraft] = useState('')

  if (!isOpen || !agent) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="chat-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="npc-chat-title">
        <header className="dialog-header chat-dialog-header">
          <div className="chat-dialog-title-wrap">
            <p className="eyebrow">NPC 대화</p>
            <h3 id="npc-chat-title">{agent.label}와 대화하기</h3>
            <p className="chat-dialog-subtitle">BE 연결 전 단계의 대화 인터페이스 목업입니다.</p>
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
            <span>{agent.usesPlaceholder ? '임시 프로필 이미지' : '연결된 프로필 이미지'}</span>
          </div>
          <span className="chat-agent-status">온라인</span>
        </section>

        <div className="chat-transcript" aria-label="NPC 대화 내용">
          <article className="chat-bubble chat-bubble-agent">
            <span className="chat-bubble-speaker">{agent.label}</span>
            <p>{buildNpcGreeting(agent)}</p>
          </article>

          <article className="chat-bubble chat-bubble-user chat-bubble-muted">
            <span className="chat-bubble-speaker">나</span>
            <p>여기에 사용자가 보낸 메시지가 순서대로 쌓이게 됩니다.</p>
          </article>
        </div>

        <section className="chat-starter-prompts" aria-label="추천 질문">
          {starterPrompts.map((prompt) => (
            <button key={prompt} type="button" className="chat-prompt-chip" onClick={() => setDraft(prompt)}>
              {prompt}
            </button>
          ))}
        </section>

        <form className="chat-composer" onSubmit={(event) => event.preventDefault()} aria-label="NPC 대화 입력창">
          <label className="field chat-composer-field">
            <span>메시지</span>
            <textarea
              name="message"
              rows={3}
              placeholder="NPC에게 보낼 메시지를 입력하세요."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>

          <div className="chat-composer-actions">
            <p>현재는 UI만 준비된 상태이며, 실제 전송은 이후 BE/대화 상태와 연결됩니다.</p>
            <button type="submit" disabled={!draft.trim()}>
              보내기
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
