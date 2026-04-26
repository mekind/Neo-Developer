type TitleSectionProps = {
  liveCount: number
}

export function TitleSection({ liveCount }: TitleSectionProps) {
  return (
    <header className="topbar topbar-compact panel-shell">
      <h1>스쿨 커먼즈</h1>
      <div className="topbar-summary" aria-label="공간 요약">
        <span className="status-pill">에이전트</span>
        <strong>{liveCount}</strong>
      </div>
    </header>
  )
}
