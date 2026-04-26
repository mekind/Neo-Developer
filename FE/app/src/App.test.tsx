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
  WorldCanvas: () => <div aria-label="Phaser map viewport" />,
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

  it('renders the shell with a game-only world stage', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /스쿨 커먼즈/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/room summary/i)).toHaveTextContent(/agents/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phaser map viewport/i)).toBeInTheDocument()
    expect(await screen.findByText('Hana')).toBeInTheDocument()
    expect(screen.queryByText(/commons floor/i)).not.toBeInTheDocument()
  })

  it('keeps the add agent flow and appends a created npc', async () => {
    render(<App />)

    fireEvent.click(screen.getAllByRole('button', { name: /^add agent$/i })[0])
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/persona/i), { target: { value: 'Warm school guide' } })
    fireEvent.change(within(dialog).getByLabelText(/backstory/i), { target: { value: 'Helps every newcomer settle in.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /^add agent$/i }))

    await waitFor(() => expect(screen.getByLabelText(/room summary/i)).toHaveTextContent('3'))
    expect(screen.getByText('Warm Guide')).toBeInTheDocument()
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

    await screen.findByText('Hana')
    expect(globalThis.fetch).toHaveBeenCalled()
    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]).toContain('https://backend-kappa-brown-63.vercel.app/agents')
  })

  it('accepts keyboard movement and interaction input without breaking the shell', async () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.2).mockReturnValueOnce(0.6).mockReturnValueOnce(0.7)

    render(<App />)
    await screen.findByText('Hana')

    vi.useFakeTimers()
    try {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      act(() => {
        vi.advanceTimersByTime(220)
      })
      fireEvent.keyUp(window, { key: 'ArrowRight' })
      act(() => {
        vi.advanceTimersByTime(220)
      })

      fireEvent.keyDown(window, { key: ' ', code: 'Space' })
      expect(screen.getByLabelText(/Phaser map viewport/i)).toBeInTheDocument()
      expect(screen.getByText('Hana')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
      randomSpy.mockRestore()
    }
  })
})
