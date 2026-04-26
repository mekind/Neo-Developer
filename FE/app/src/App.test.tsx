import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

type MockResponseConfig = {
  ok?: boolean
  status?: number
  json: unknown
}

const defaultAgents = [
  {
    id: 'agent-seed-1',
    name: 'Guide Mina',
    archetype: 'maker',
    personaSummary: 'Warm school guide',
    backstoryPrompt: 'Helps newcomers settle in.',
    createdAt: '2026-04-26T00:00:00.000Z',
  },
  {
    id: 'agent-seed-2',
    name: 'Spark Joon',
    archetype: 'spark',
    personaSummary: 'Creative spark',
    backstoryPrompt: 'Keeps the commons lively.',
    createdAt: '2026-04-26T00:05:00.000Z',
  },
]

const defaultItems = [
  {
    id: '1',
    name: 'Mock Coffee',
    description: 'A freshly brewed mock coffee',
    price: 4500,
    createdAt: '2026-04-26T00:00:00.000Z',
    updatedAt: '2026-04-26T00:00:00.000Z',
  },
]

function installFetchMock(overrides: Record<string, MockResponseConfig> = {}) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    const pathname = new URL(url).pathname
    const method = init?.method ?? 'GET'

    const config = overrides[`${method} ${pathname}`] ?? overrides[pathname] ??
      (pathname === '/items'
        ? { ok: true, status: 200, json: defaultItems }
        : pathname === '/agents' && method === 'GET'
          ? { ok: true, status: 200, json: defaultAgents }
          : { ok: false, status: 404, json: {} })

    return {
      ok: config.ok ?? true,
      status: config.status ?? 200,
      json: async () => config.json,
    } as Response
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-kappa-brown-63.vercel.app')
    installFetchMock()
  })

  it('renders the layout with a controllable user avatar and backend agent NPCs', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /편하게 둘러보는 데모 공간/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent(/current player/i)
    expect(screen.getByRole('button', { name: /open agent dialog/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    expect(screen.getByText(/controlling you at \(124, 180\)/i)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /spawned avatars: 3/i })).toBeInTheDocument()
    await screen.findByRole('list', { name: /live items list/i })
  })

  it('creates an agent npc from the dialog without replacing the user avatar', async () => {
    installFetchMock({
      'POST /agents': {
        json: {
          id: 'agent-3',
          name: 'Nova Guide',
          archetype: 'maker',
          personaSummary: 'Warm school guide',
          backstoryPrompt: 'Helps every newcomer settle in.',
          createdAt: '2026-04-26T00:10:00.000Z',
        },
      },
    })

    render(<App />)
    await screen.findByRole('heading', { name: /spawned avatars: 3/i })

    fireEvent.click(screen.getByRole('button', { name: /open agent dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Warm school guide' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), {
      target: { value: 'Helps every newcomer settle in.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create agent/i }))

    expect(await screen.findByRole('heading', { name: /spawned avatars: 4/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/current character summary/i)).toHaveTextContent(/you is the controllable user avatar/i)
    expect(screen.getByText(/controlling you at \(124, 180\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/nova guide · maker/i)).toHaveLength(2)
  })

  it('renders live items from the backend demo slice', async () => {
    render(<App />)

    const liveItemsList = await screen.findByRole('list', { name: /live items list/i })
    expect(within(liveItemsList).getByText('Mock Coffee')).toBeInTheDocument()
  })

  it('shows an error state when the items request fails', async () => {
    installFetchMock({ '/items': { ok: false, status: 500, json: {} } })

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
  })

  it('shows submit errors inside the dialog when agent creation fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      const pathname = new URL(url).pathname

      if (pathname === '/items') {
        return { ok: true, status: 200, json: async () => defaultItems } as Response
      }

      if (pathname === '/agents' && init?.method === 'POST') {
        return { ok: false, status: 500, json: async () => ({}) } as Response
      }

      if (pathname === '/agents') {
        return { ok: true, status: 200, json: async () => defaultAgents } as Response
      }

      return { ok: false, status: 404, json: async () => ({}) } as Response
    })

    render(<App />)
    await screen.findByRole('heading', { name: /spawned avatars: 3/i })

    fireEvent.click(screen.getByRole('button', { name: /open agent dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Warm guide' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Supports the class.' } })
    fireEvent.click(screen.getByRole('button', { name: /create agent/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
    fetchMock.mockRestore()
  })

  it('shows a configuration error when the API base URL is missing', async () => {
    vi.unstubAllEnvs()

    render(<App />)

    const alerts = await screen.findAllByRole('alert')
    expect(alerts).toHaveLength(2)
    alerts.forEach((alert) => expect(alert).toHaveTextContent('Missing VITE_API_BASE_URL configuration.'))
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('moves only the user avatar and unlocks interaction feedback near an agent npc', async () => {
    render(<App />)
    await screen.findByRole('heading', { name: /spawned avatars: 3/i })

    vi.useFakeTimers()
    try {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      act(() => {
        vi.advanceTimersByTime(450)
      })
      fireEvent.keyUp(window, { key: 'ArrowRight' })

      expect(screen.getByText(/controlling you at \(268, 180\)/i)).toBeInTheDocument()
      expect(screen.getByText(/press e near guide mina to interact/i)).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'e' })

      expect(screen.getByText(/you greeted guide mina/i)).toBeInTheDocument()
      expect(screen.getByText(/distance to guide mina: 48px/i)).toBeInTheDocument()
      expect(screen.getAllByText(/guide mina/i)[0]).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
