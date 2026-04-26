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
      (pathname === '/agents' && method === 'POST'
        ? {
            ok: true,
            status: 200,
            json: {
              id: 'new-agent',
              name: 'Warm Guide',
              archetype: 'maker',
              personaSummary: 'Warm school guide',
              backstoryPrompt: 'Helps every newcomer settle in.',
              createdAt: '2026-04-26T00:00:00.000Z',
            },
          }
        : {
            ok: true,
            status: 200,
            json: backendAgents,
          })

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
    <div aria-label="Phaser map viewport">
      <p>Controlling {player.label} at ({player.xPercent.toFixed(0)}%, {player.yPercent.toFixed(0)}%).</p>
      <p>
        {isLoading
          ? 'Loading backend roster.'
          : errorMessage
            ? 'Backend roster unavailable.'
            : interactionTarget
              ? `Press E near ${interactionTarget.label} to interact.`
              : agents.length > 0
                ? 'Phaser-mounted once per load.'
                : 'No backend agents returned.'}
      </p>
      <p>{lastInteractionMessage ?? 'No interaction triggered yet.'}</p>
      <img src={player.imageSrc} alt={`${player.label} avatar`} />
      {agents.map((agent) => (
        <figure key={agent.id}>
          <img src={agent.imageSrc} alt={`${agent.label} avatar`} />
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
    expect(screen.getByLabelText(/current player summary/i)).toHaveTextContent(/you is the controllable user avatar/i)
    expect(screen.getByLabelText(/room summary/i)).toHaveTextContent(/live/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    expect(screen.getByText(/controlling you at \(12%, 32%\)/i)).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /hana avatar/i })).toBeInTheDocument()
  })

  it('keeps the add agent flow and appends a created npc', async () => {
    render(<App />)

    fireEvent.click(screen.getAllByRole('button', { name: /^add agent$/i })[0])
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/persona/i), { target: { value: 'Warm school guide' } })
    fireEvent.change(within(dialog).getByLabelText(/backstory/i), { target: { value: 'Helps every newcomer settle in.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /^add agent$/i }))

    await waitFor(() => expect(screen.getByLabelText(/room summary/i)).toHaveTextContent('3'))
    expect(screen.getAllByText('Warm Guide').length).toBeGreaterThan(1)
  })

  it('renders a simple backend agent roster', async () => {
    render(<App />)

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

    const placeholderAvatar = await screen.findByRole('img', { name: /min avatar/i })
    expect(placeholderAvatar.getAttribute('src')).toContain('data:image/svg+xml')
  })

  it('falls back to the placeholder avatar for disallowed image sources', async () => {
    installFetchMock({
      '/agents': {
        json: [{ id: 'unsafe-agent', name: 'Unsafe', imageAsset: 'ftp://example.com/avatar.png' }],
      },
    })

    render(<App />)

    const fallbackAvatar = await screen.findByRole('img', { name: /unsafe avatar/i })
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

    await screen.findByRole('img', { name: /hana avatar/i })
    expect(globalThis.fetch).toHaveBeenCalled()
    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]).toContain('https://backend-kappa-brown-63.vercel.app/agents')
  })

  it('moves only the user avatar and unlocks interaction feedback near an agent npc', async () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.2).mockReturnValueOnce(0.6).mockReturnValueOnce(0.7)

    render(<App />)
    await screen.findByRole('img', { name: /hana avatar/i })

    vi.useFakeTimers()
    try {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      act(() => {
        vi.advanceTimersByTime(180)
      })
      fireEvent.keyUp(window, { key: 'ArrowRight' })

      expect(screen.getByText(/controlling you at \(21%, 32%\)/i)).toBeInTheDocument()
      expect(screen.getByText(/press e near hana to interact/i)).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'e' })

      expect(screen.getByText(/you greeted hana/i)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
      randomSpy.mockRestore()
    }
  })
})
