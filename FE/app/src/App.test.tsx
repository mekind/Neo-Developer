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
    <div aria-label="Phaser map viewport">
      <p>Controlling {player.label} at ({player.xPercent.toFixed(0)}%, {player.yPercent.toFixed(0)}%).</p>
      <p>
        {isLoading
          ? 'Loading backend roster.'
          : errorMessage
            ? 'Backend roster unavailable.'
            : interactionTarget
              ? `Press Space near ${interactionTarget.label} to interact.`
              : agents.length > 0
                ? 'Arrow keys move. Space interacts when a target enters range.'
                : 'No backend agents returned.'}
      </p>
      <p>Minimap visible.</p>
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
    expect(screen.getByText(/controlling you at \(12%, 32%\)/i)).toBeInTheDocument()
    expect(screen.getByText(/minimap visible/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /hana avatar/i })).toBeInTheDocument()
  })

  it('opens the npc dialog with a random default name and appends a created npc locally', async () => {
    render(<App />)

    fireEvent.click(screen.getAllByRole('button', { name: /^add agent$/i })[0])
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/NPC 추가/i)

    const nameInput = within(dialog).getByLabelText(/이름/i) as HTMLInputElement
    expect(nameInput.value).not.toBe('')

    fireEvent.change(nameInput, { target: { value: 'Warm Guide' } })
    fireEvent.change(within(dialog).getByLabelText(/페르소나/i), { target: { value: 'Warm school guide' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /^NPC 추가$/i }))

    await waitFor(() => expect(screen.getAllByText('Warm Guide').length).toBeGreaterThan(1))
  })


  it('opens the npc chat dialog from the header trigger button', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /open npc chat/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/chat with hana/i)
    expect(dialog).toHaveTextContent(/message/i)
    expect(within(dialog).getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('renders a simple backend agent roster', async () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /^add agent$/i })).toBeInTheDocument()

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

  it('moves only the user avatar with smoothed motion and unlocks interaction feedback near an agent npc', async () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.2).mockReturnValueOnce(0.6).mockReturnValueOnce(0.7)

    render(<App />)
    await screen.findByRole('img', { name: /hana avatar/i })

    vi.useFakeTimers()
    try {
      expect(screen.getByText(/controlling you at/i)).toHaveTextContent('Controlling You at (12%, 32%).')
      expect(screen.getByText(/press space near hana to interact/i)).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      act(() => {
        vi.advanceTimersByTime(220)
      })
      fireEvent.keyUp(window, { key: 'ArrowRight' })
      act(() => {
        vi.advanceTimersByTime(220)
      })

      const statusLines = screen.getAllByText((content) => content.includes('Controlling'))
      expect(statusLines[0]?.textContent).not.toBe('Controlling You at (12%, 32%).')

      fireEvent.keyDown(window, { key: ' ', code: 'Space' })

      expect(screen.getByText(/you greeted hana/i)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
      randomSpy.mockRestore()
    }
  })
})
