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
        <button type="button" className="secondary-button topbar-chat-trigger" onClick={onOpenTestChat} disabled={isChatDisabled}>
          Open NPC Chat
        </button>
        <div className="topbar-summary" aria-label="Room summary">
          <span className="status-pill">Agents</span>
          <strong>{liveCount}</strong>
        </div>
      </div>
    </header>
  )
}
