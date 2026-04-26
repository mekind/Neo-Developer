import { useState } from 'react'

import { archetypeOptions, type CharacterArchetype, type WorldCharacter } from '@/game/characters'

type InteractionPanelProps = {
  characters: WorldCharacter[]
  onCreateCharacter: (name: string, archetype: CharacterArchetype) => void
}

const futureActions = [
  '좌측 사이드바에 상태/채팅/유저 목록 배치 가능',
  '월드 상호작용 UI는 오버레이로 확장 가능',
  '실시간 기능은 이후 단계에서 연결',
]

export function InteractionPanel({ characters, onCreateCharacter }: InteractionPanelProps) {
  const [name, setName] = useState('')
  const [archetype, setArchetype] = useState<CharacterArchetype>('scout')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) return

    onCreateCharacter(trimmedName, archetype)
    setName('')
  }

  const currentCharacter = characters.at(-1)

  return (
    <section>
      <h2>Sidebar UI Placeholder</h2>
      <p>Gather-like 레이아웃 기준으로 보조 정보와 캐릭터 생성 컨트롤이 이 영역에 들어갑니다.</p>

      <form className="creation-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Character name</span>
          <input
            name="name"
            placeholder="e.g. Nova"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Archetype</span>
          <select value={archetype} onChange={(event) => setArchetype(event.target.value as CharacterArchetype)}>
            {archetypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit">Create character</button>
      </form>

      <section className="panel-section" aria-label="Current character summary">
        <h3>Current world character</h3>
        {currentCharacter ? (
          <p>
            <strong>{currentCharacter.name}</strong> joined as a {currentCharacter.archetype}.
          </p>
        ) : (
          <p>No characters created yet.</p>
        )}
      </section>

      <section className="panel-section" aria-label="Spawned character list">
        <h3>Spawned characters</h3>
        {characters.length > 0 ? (
          <ul className="action-list">
            {characters.map((character) => (
              <li key={character.id}>
                {character.name} · {character.archetype}
              </li>
            ))}
          </ul>
        ) : (
          <p>Each submission appends another prototype avatar to the world.</p>
        )}
      </section>

      <ul className="action-list muted-list">
        {futureActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </section>
  )
}
