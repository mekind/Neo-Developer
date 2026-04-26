const initialActions = ['좌측 사이드바에 상태/채팅/유저 목록 배치', '월드 상호작용 UI는 오버레이로 확장', '실시간 기능은 이후 단계에서 연결']

export function InteractionPanel() {
  return (
    <section>
      <h2>Sidebar UI Placeholder</h2>
      <p>Gather-like 레이아웃 기준으로 보조 정보와 컨트롤이 이 영역에 들어갑니다.</p>

      <ul className="action-list">
        {initialActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </section>
  )
}
