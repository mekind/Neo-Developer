import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

type AgentPayload = {
  id: string
  name?: string
  imageAsset?: string | null
}

const backendAgents: AgentPayload[] = [
  {
    id: 'mentor-hana',
    name: 'Hana',
    imageAsset: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22/%3E',
  },
  {
    id: 'guide-min',
    name: 'Min',
    imageAsset: null,
  },
]

function installFetchMock(overrides: Record<string, { ok?: boolean; status?: number; json: unknown }> = {}) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    const pathname = new URL(url).pathname
    const method = init?.method ?? 'GET'
    const override = overrides[`${method} ${pathname}`] ?? overrides[pathname]

    const payload =
      override ??
      {
        ok: true,
        status: 200,
        json: backendAgents,
      }

    return {
      ok: payload.ok ?? true,
      status: payload.status ?? 200,
      json: async () => payload.json,
    } as Response
  })
}

vi.mock('@/game/WorldCanvas', () => ({
  WorldCanvas: ({
    agents,
    player,
    isLoading,
    errorMessage,
    interactionTarget,
    lastInteractionMessage,
  }: {
    agents: Array<{ id: string; label: string; imageSrc: string }>
    player: { label: string; xPercent: number; yPercent: number; imageSrc: string }
    isLoading: boolean
    errorMessage: string | null
    interactionTarget: { id: string; label: string } | null
    lastInteractionMessage: string | null
  }) => (
    <div aria-label="Phaser 맵 화면">
      <p>{player.label} 위치 · X {player.xPercent.toFixed(0)}% / Y {player.yPercent.toFixed(0)}%</p>
      <p>
        {isLoading
          ? '에이전트 배치를 불러오는 중입니다.'
          : errorMessage
            ? '에이전트 배치를 불러오지 못했습니다.'
            : interactionTarget
              ? `스페이스바로 ${interactionTarget.label}와 대화할 수 있어요.`
              : agents.length > 0
                ? '방향키로 이동하고, 가까이 가면 스페이스바로 상호작용할 수 있어요.'
                : '표시할 에이전트가 아직 없습니다.'}
      </p>
      <p>미니맵 표시 중</p>
      <p>{lastInteractionMessage ?? '아직 상호작용이 시작되지 않았습니다.'}</p>
      <img src={player.imageSrc} alt={`${player.label} 아바타`} />
      {agents.map((agent) => (
        <figure key={agent.id}>
          <img src={agent.imageSrc} alt={`${agent.label} 아바타`} />
          <figcaption>{agent.label}</figcaption>
        </figure>
      ))}
    </div>
  ),
}))

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-kappa-brown-63.vercel.app')
    installFetchMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('renders the backend-driven shell with a separate controllable player avatar', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /스쿨 커먼즈/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/공간 요약/i)).toHaveTextContent(/에이전트/i)
    expect(screen.getByText(/You 위치 · X 12% \/ Y 32%/i)).toBeInTheDocument()
    expect(screen.getByText(/미니맵 표시 중/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/월드 스테이지/i)).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /hana 아바타/i })).toBeInTheDocument()
  })

  it('opens the npc dialog with a random default name and appends a created npc locally', async () => {
    render(<App />)

    fireEvent.click(screen.getAllByRole('button', { name: /에이전트 추가/i })[0])
    const dialog = screen.getByRole('dialog')

    const nameInput = within(dialog).getByLabelText(/이름/i) as HTMLInputElement
    expect(nameInput.value).not.toBe('')

    fireEvent.change(nameInput, { target: { value: 'Warm Guide' } })
    fireEvent.change(within(dialog).getByLabelText(/페르소나/i), { target: { value: 'Warm school guide' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /에이전트 추가/i }))

    await waitFor(() => expect(screen.getAllByText('Warm Guide').length).toBeGreaterThan(1))
  })

  it('opens the npc chat dialog from the header trigger button', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /npc 대화 열기/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/hana와 대화하기/i)
    expect(dialog).toHaveTextContent(/메시지/i)
    expect(within(dialog).getByRole('button', { name: /보내기/i })).toBeDisabled()
  })

  it('renders a simple backend agent roster', async () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /에이전트 추가/i })).toBeInTheDocument()

    const roster = await screen.findByRole('list', { name: /backend agent list/i })
    expect(within(roster).getByText('Hana')).toBeInTheDocument()
    expect(within(roster).getByText('Min')).toBeInTheDocument()
  })

  it('falls back to the agent id when the backend omits a display name', async () => {
    installFetchMock({
      '/agents': {
        json: [{ id: 'mystery-agent', imageAsset: null }],
      },
    })

    render(<App />)

    const roster = await screen.findByRole('list', { name: /backend agent list/i })
    expect(within(roster).getByText('mystery-agent')).toBeInTheDocument()
  })

  it('uses a placeholder avatar when the backend agent has no image asset', async () => {
    render(<App />)

    const placeholderAvatar = await screen.findByRole('img', { name: /min 아바타/i })
    expect(placeholderAvatar.getAttribute('src')).toContain('data:image/svg+xml')
  })

  it('falls back to the placeholder avatar for disallowed image sources', async () => {
    installFetchMock({
      '/agents': {
        json: [{ id: 'unsafe-agent', name: 'Unsafe', imageAsset: 'ftp://example.com/avatar.png' }],
      },
    })

    render(<App />)

    const fallbackAvatar = await screen.findByRole('img', { name: /unsafe 아바타/i })
    expect(fallbackAvatar.getAttribute('src')).toContain('data:image/svg+xml')
  })

  it('shows an error state when the backend request fails', async () => {
    installFetchMock({
      '/agents': { ok: false, status: 500, json: {} },
    })

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
  })

  it('falls back to the default backend URL when the env is missing', async () => {
    vi.unstubAllEnvs()

    render(<App />)

    await screen.findByRole('img', { name: /hana 아바타/i })
    expect(globalThis.fetch).toHaveBeenCalled()
    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]).toContain('https://backend-kappa-brown-63.vercel.app/agents')
  })

  it('moves only the user avatar with smoothed motion and unlocks interaction feedback near an agent npc', async () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.2).mockReturnValueOnce(0.6).mockReturnValueOnce(0.7)

    render(<App />)
    await screen.findByRole('img', { name: /hana 아바타/i })

    vi.useFakeTimers()
    try {
      expect(screen.getByText(/위치/i)).toHaveTextContent('You 위치 · X 12% / Y 32%')
      expect(screen.getByText(/스페이스바로 hana와 대화할 수 있어요\./i)).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      act(() => {
        vi.advanceTimersByTime(220)
      })
      fireEvent.keyUp(window, { key: 'ArrowRight' })
      act(() => {
        vi.advanceTimersByTime(220)
      })

      const statusLines = screen.getAllByText((content) => content.includes('위치'))
      expect(statusLines[0]?.textContent).not.toBe('You 위치 · X 12% / Y 32%')

      fireEvent.keyDown(window, { key: ' ', code: 'Space' })

      expect(screen.getByText(/you greeted hana/i)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
      randomSpy.mockRestore()
    }
  })
})
