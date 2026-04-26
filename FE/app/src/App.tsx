import { InteractionPanel } from '@/components/InteractionPanel'
import { WorldCanvas } from '@/game/WorldCanvas'

export default function App() {
  return (
    <main className="app-shell">
      <section className="world-column">
        <header className="world-header">
          <p className="eyebrow">demo-friendly baseline</p>
          <h1>편하게 둘러보는 데모 공간</h1>
          <p className="description">
            처음 보는 사람도 부담 없이 이해할 수 있도록, 따뜻한 톤과 읽기 쉬운 화면을 기준으로
            프런트엔드 데모 경험을 정리했습니다.
          </p>
        </header>
        <WorldCanvas />
      </section>

      <aside className="side-column">
        <InteractionPanel />
      </aside>
    </main>
  )
}
