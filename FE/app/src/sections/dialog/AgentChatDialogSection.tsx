import type { WorldAgent } from '@/game/agents'

type AgentChatDialogSectionProps = {
  agent: WorldAgent | null
  isOpen: boolean
  onClose: () => void
}

function buildNpcLine(agent: WorldAgent) {
  return agent.usesPlaceholder
    ? `${agent.label}: 아직 프로필 이미지는 임시 상태지만, 여기서 바로 대화를 이어갈 수 있어요.`
    : `${agent.label}: 스쿨 커먼즈에 온 걸 환영해요. 무엇을 도와드릴까요?`
}

export function AgentChatDialogSection({ agent, isOpen, onClose }: AgentChatDialogSectionProps) {
  if (!isOpen || !agent) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="chat-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="npc-chat-title">
        <header className="dialog-header chat-dialog-header">
          <div>
            <p className="eyebrow">NPC 대화</p>
            <h3 id="npc-chat-title">{agent.label}와 대화하기</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            닫기
          </button>
        </header>

        <div className="chat-transcript" aria-label="NPC 대화 내용">
          <article className="chat-bubble chat-bubble-agent">
            <p>{buildNpcLine(agent)}</p>
          </article>
        </div>

        <footer className="chat-dialog-footer">
          <p>이 창은 NPC와 상호작용했을 때 열리는 채팅 다이얼로그의 첫 단계입니다.</p>
        </footer>
      </section>
    </div>
  )
}
