type TitleSectionProps = {
  liveCount: number
}

export function TitleSection({ liveCount }: TitleSectionProps) {
  return (
    <header className="topbar topbar-compact panel-shell">
      <h1>스쿨 커먼즈</h1>
      <div className="topbar-summary" aria-label="Room summary">
        <span className="status-pill">Agents</span>
        <strong>{liveCount}</strong>
      </div>
    </header>
  )
}
