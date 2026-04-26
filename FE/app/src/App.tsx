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
          <p className="eyebrow">demo-friendly baseline</p>
          <h1>편하게 둘러보는 데모 공간</h1>
        </div>
        <p className="topbar-copy">
          처음 보는 사람도 부담 없이 이해할 수 있도록, 따뜻한 중간 톤의 월드와 읽기 쉬운 안내 흐름으로
          데모 경험을 정리합니다.
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
              생성된 캐릭터가 따뜻한 공용 공간 톤의 월드에 바로 나타나며, 복잡한 설명보다 먼저 편안한 첫인상을
              전달하도록 구성했습니다.
            </p>
          </div>
          <WorldCanvas characters={characters} currentCharacter={currentCharacter} />
        </section>
      </div>
    </main>
  )
}
