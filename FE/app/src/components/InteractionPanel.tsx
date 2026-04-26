const initialActions = ['천천히 공간 둘러보기', '안내 문구 확인하기', '가까운 요소와 상호작용 준비하기']

export function InteractionPanel() {
  return (
    <section className="panel">
      <p className="section-label">interaction guide</p>
      <h2>낯설지 않게 시작하는 안내</h2>
      <p>
        이 영역은 복잡한 기능을 먼저 보여주기보다, 사용자가 지금 무엇을 보면 되는지 편하게 이해할 수
        있도록 돕는 상호작용 레이어를 위한 자리입니다.
      </p>

      <ul className="action-list">
        {initialActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </section>
  )
}
