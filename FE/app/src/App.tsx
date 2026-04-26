import { useMemo, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import { archetypeOptions, type CharacterArchetype, type WorldCharacter } from '@/game/characters'
import { WorldCanvas } from '@/game/WorldCanvas'

export default function App() {
  const [characters, setCharacters] = useState<WorldCharacter[]>([])

  const handleCreateCharacter = (name: string, archetype: CharacterArchetype) => {
    setCharacters((current) => [
      ...current,
      (() => {
        const palette = archetypeOptions.find((option) => option.value === archetype) ?? archetypeOptions[0]
        const index = current.length

        return {
          id: `${name}-${index + 1}`,
          name,
          archetype,
          color: palette.color,
          x: 160 + (index % 4) * 180,
          y: 180 + Math.floor(index / 4) * 110,
        }
      })(),
    ])
  }

  const currentCharacter = useMemo(() => characters.at(-1) ?? null, [characters])

  return (
    <main className="app-shell">
      <header className="topbar panel-shell">
        <div>
          <p className="eyebrow">FE bootstrap</p>
          <h1>Gather-like World Layout</h1>
        </div>
        <p className="topbar-copy">
          상단 바와 사이드바를 유지한 채, 따뜻한 학교 공용공간 톤의 월드에서 패널 기반 캐릭터 생성 플로우를 바로 검증합니다.
        </p>
      </header>

      <div className="app-body">
        <aside className="sidebar panel-shell">
          <InteractionPanel characters={characters} onCreateCharacter={handleCreateCharacter} />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">World viewport</p>
            <p className="description">
              Gather-like 레이아웃을 유지하면서, 생성된 캐릭터가 따뜻한 학교 공용공간 톤의 월드에 즉시 나타나는 첫 상호작용 루프를 보여줍니다.
            </p>
          </div>
          <WorldCanvas characters={characters} currentCharacter={currentCharacter} />
        </section>
      </div>
    </main>
  )
}
