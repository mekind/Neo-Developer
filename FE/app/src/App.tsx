import { InteractionPanel } from '@/components/InteractionPanel'
import { WorldCanvas } from '@/game/WorldCanvas'

export default function App() {
  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">FE bootstrap</p>
          <h1>Gather-like World Layout</h1>
        </div>
        <p className="topbar-copy">상단 바와 사이드바를 제외한 나머지 영역에 월드가 배치되는 구조입니다.</p>
      </header>

      <div className="app-body">
        <aside className="sidebar panel-shell">
          <InteractionPanel />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">World viewport</p>
            <p className="description">
              Gather Town처럼 실제 월드 화면은 상단 UI와 사이드 UI를 제외한 본문 영역을 최대한 사용하고, 현재는 따뜻한 학교 공용공간 톤으로 맞추고 있습니다.
            </p>
          </div>
          <WorldCanvas />
        </section>
      </div>
    </main>
  )
}
