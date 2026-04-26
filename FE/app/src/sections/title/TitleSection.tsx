type TitleSectionProps = {
  liveCount: number
}

export function TitleSection({ liveCount }: TitleSectionProps) {
  return (
    <header className="topbar panel-shell">
      <div>
        <p className="eyebrow">Neo Commons</p>
        <h1>스쿨 커먼즈</h1>
      </div>
      <div className="topbar-summary" aria-label="Room summary">
        <span className="status-pill">Live</span>
        <strong>{liveCount}</strong>
      </div>
    </header>
  )
}
