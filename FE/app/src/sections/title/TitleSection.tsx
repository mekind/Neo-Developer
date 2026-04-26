type TitleSectionProps = {
  liveCount: number
  onOpenTestChat: () => void
  isChatDisabled: boolean
}

export function TitleSection({ liveCount, onOpenTestChat, isChatDisabled }: TitleSectionProps) {
  return (
    <header className="topbar topbar-compact panel-shell">
      <h1>스쿨 커먼즈</h1>
      <div className="topbar-actions">
        <button
          type="button"
          className="secondary-button topbar-chat-trigger"
          onClick={onOpenTestChat}
          disabled={isChatDisabled}
          aria-label="NPC 대화 열기"
        >
          NPC 대화 열기
        </button>
        <div className="topbar-summary" aria-label="공간 요약">
          <span className="status-pill">에이전트</span>
          <strong>{liveCount}</strong>
        </div>
      </div>
    </header>
  )
}
