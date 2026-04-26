import { InteractionPanel } from '@/components/InteractionPanel'
import { WorldCanvas } from '@/game/WorldCanvas'

export default function App() {
  return (
    <main className="app-shell">
      <section className="world-column">
        <header className="world-header">
          <p className="eyebrow">FE bootstrap</p>
          <h1>Gather-like Frontend Starter</h1>
          <p className="description">
            Fast-start baseline: React UI shell + Canvas world placeholder on top of Vite + TypeScript.
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
