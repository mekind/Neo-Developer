import { act, fireEvent, render, screen, within } from '@testing-library/react'
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

function installFetchMock(payload: AgentPayload[] = backendAgents, status = 200) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response)
}

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

  it('renders a simple backend agent roster', async () => {
    render(<App />)

    const roster = await screen.findByRole('list', { name: /backend agent list/i })
    expect(within(roster).getByText('Hana')).toBeInTheDocument()
    expect(within(roster).getByText('Min')).toBeInTheDocument()
  })

  it('falls back to the agent id when the backend omits a display name', async () => {
    installFetchMock([
      {
        id: 'mystery-agent',
        imageAsset: null,
      },
    ])

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
    installFetchMock([
      {
        id: 'unsafe-agent',
        name: 'Unsafe',
        imageAsset: 'ftp://example.com/avatar.png',
      },
    ])

    render(<App />)

    const fallbackAvatar = await screen.findByRole('img', { name: /unsafe avatar/i })
    expect(fallbackAvatar.getAttribute('src')).toContain('data:image/svg+xml')
  })

  it('shows an error state when the backend request fails', async () => {
    installFetchMock([], 500)

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
  })

  it('shows a configuration error when the API base URL is missing', async () => {
    vi.unstubAllEnvs()

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing VITE_API_BASE_URL configuration.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
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
      expect(screen.getByText(/distance to hana: 1.0%/i)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
      randomSpy.mockRestore()
    }
  })
})
