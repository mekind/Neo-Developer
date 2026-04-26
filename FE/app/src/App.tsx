import { useMemo, useState } from 'react'

import { InteractionPanel } from '@/components/InteractionPanel'
import {
  createPendingWorldCharacter,
  createReadyWorldCharacter,
  type CharacterArchetype,
  type WorldCharacter,
} from '@/game/characters'
import { WorldCanvas } from '@/game/WorldCanvas'
import { createAgent } from '@/services/agents'

function buildPendingId() {
  return `pending-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

export default function App() {
  const [characters, setCharacters] = useState<WorldCharacter[]>([])
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const [createAgentError, setCreateAgentError] = useState<string | null>(null)

  const handleCreateCharacter = async (name: string, archetype: CharacterArchetype) => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const pendingId = buildPendingId()

    setCreateAgentError(null)
    setIsCreatingAgent(true)
    setCharacters((current) => [...current, createPendingWorldCharacter(pendingId, trimmedName, archetype, current.length)])

    try {
      const createdAgent = await createAgent({ name: trimmedName, archetype })

      setCharacters((current) => {
        const pendingIndex = current.findIndex((character) => character.id === pendingId)
        if (pendingIndex === -1) return current

        const nextCharacters = [...current]
        nextCharacters[pendingIndex] = createReadyWorldCharacter(createdAgent, pendingIndex)
        return nextCharacters
      })
    } catch (error) {
      setCharacters((current) => current.filter((character) => character.id !== pendingId))
      setCreateAgentError(error instanceof Error ? error.message : 'Failed to create agent.')
    } finally {
      setIsCreatingAgent(false)
    }
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
          <InteractionPanel
            characters={characters}
            onCreateCharacter={handleCreateCharacter}
            isCreatingAgent={isCreatingAgent}
            createAgentError={createAgentError}
          />
        </aside>

        <section className="world-stage panel-shell" aria-label="world stage">
          <div className="world-stage-copy">
            <p className="eyebrow">World viewport</p>
            <p className="description">
              생성 요청 중인 에이전트는 메인 화면에 대기 상태로 나타나고, 이미지 생성까지 완료되면 월드의 정식
              멤버로 반영됩니다.
            </p>
          </div>
          <WorldCanvas characters={characters} currentCharacter={currentCharacter} />
        </section>
      </div>
    </main>
  )
}
