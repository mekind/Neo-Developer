import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'

import App from './App'
import { resetAgentSessionForTests } from '@/services/agents'

type AgentPayload = {
  id: string
  name?: string
  persona?: Record<string, unknown> | null
  imageAsset?: string | null
}

type MockPayload = {
  ok?: boolean
  status?: number
  json: unknown
}

const fixedUserId = '5c4a5a9b-ac4f-4e2f-a7ba-4d7e93bd2e86'
const backendAgents: AgentPayload[] = [
  {
    id: 'mentor-hana',
    name: 'Hana',
    persona: { summary: 'Warm school guide' },
    imageAsset: 'lpc:cafe-bot',
  },
]

function installFetchMock(overrides: Record<string, MockPayload> = {}) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
    const pathname = new URL(url, 'https://fe.local').pathname
    const method = init?.method ?? 'GET'
    const key = `${method} ${pathname}`
    const override = overrides[key] ?? overrides[pathname]

    let payload = override

    if (!payload) {
      if (method === 'GET' && pathname === `/users/${fixedUserId}/agents`) {
        payload = { json: backendAgents }
      } else if (method === 'POST' && pathname === `/users/${fixedUserId}/agents`) {
        payload = {
          json: {
            id: 'created-agent',
            name: 'Warm Guide',
            persona: { summary: 'Warm school guide' },
            imageAsset: 'lpc:cafe-bot',
          },
        }
      } else if (method === 'POST' && pathname === `/users/${fixedUserId}/agents/mentor-hana/invoke`) {
        payload = {
          json: {
            reply: '안녕하세요! 저는 하나예요.',
            used_skills: ['insane-search'],
            refused: null,
          },
        }
      } else {
        payload = { json: {} }
      }
    }

    return {
      ok: payload.ok ?? true,
      status: payload.status ?? 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => payload.json,
      text: async () => JSON.stringify(payload.json),
    } as Response
  })
}

function installLocalStorageMock() {
  const store = new Map<string, string>()
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  })
}

vi.mock('@/game/WorldCanvas', () => ({
  WorldCanvas: ({ onAgentInteraction }: { onAgentInteraction: (agent: { id: string; label: string; usesPlaceholder: boolean; imageSrc: string }) => void }) => (
    <div aria-label="Phaser map viewport">
      <button
        type="button"
        onClick={() =>
          onAgentInteraction({
            id: 'mentor-hana',
            label: 'Hana',
            usesPlaceholder: false,
            imageSrc: '/lpc-character-pipeline/.example/cafe-bot/character.png',
          })
        }
      >
        Simulate interaction
      </button>
      <span>controlling you at (12%, 32%)</span>
      <span>minimap visible</span>
    </div>
  ),
}))

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-kappa-brown-63.vercel.app')
    installLocalStorageMock()
    window.localStorage.clear()
    resetAgentSessionForTests()
    installFetchMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    window.localStorage.clear()
    resetAgentSessionForTests()
  })

  it('renders the shell with the game viewport and backend roster', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /myclaw/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Phaser map viewport/i)).toBeInTheDocument()
    expect(screen.getByText(/controlling you at \(12%, 32%\)/i)).toBeInTheDocument()
    expect(screen.getByText(/minimap visible/i)).toBeInTheDocument()
    expect(await screen.findByText('Hana')).toBeInTheDocument()
    expect(await screen.findByText('Noa')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /lpc 크레딧/i })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/공간 요약/i)).toHaveTextContent('2'))
  })

  it('creates a backend agent from the dialog', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /에이전트 추가/i }))
    const dialog = screen.getByRole('dialog', { name: /에이전트 npc 추가|에이전트 NPC 추가/i })
    fireEvent.change(within(dialog).getByLabelText(/이름/i), { target: { value: 'Warm Guide' } })
    fireEvent.change(within(dialog).getByLabelText(/페르소나/i), { target: { value: 'Warm school guide' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /^에이전트 추가$/i }))

    await waitFor(() => expect(screen.getByText('Warm Guide')).toBeInTheDocument())
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/users/${fixedUserId}/agents`),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('opens chat from the header trigger, sends an invoke request, and shows the cropped avatar frame', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /npc 대화 열기/i }))

    const dialog = await screen.findByRole('dialog', { name: /hana와 대화하기/i })
    expect(screen.getByRole('img', { name: /hana 아바타/i })).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText(/메시지/i), { target: { value: '안녕!' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /보내기/i }))

    expect(await within(dialog).findByText('안녕하세요! 저는 하나예요.')).toBeInTheDocument()
    expect(within(dialog).getByText(/사용 스킬: insane-search/i)).toBeInTheDocument()
  })

  it('closes chat with Escape', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /npc 대화 열기/i }))
    expect(await screen.findByRole('dialog', { name: /hana와 대화하기/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /hana와 대화하기/i })).not.toBeInTheDocument())
  })

  it('opens chat from the game interaction callback', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /simulate interaction/i }))

    expect(await screen.findByRole('dialog', { name: /hana와 대화하기/i })).toBeInTheDocument()
  })

  it('shows an error state when the backend request fails and leaves the roster empty', async () => {
    installFetchMock({ [`GET /users/${fixedUserId}/agents`]: { ok: false, status: 500, json: {} } })

    render(<App />)

    expect(await screen.findByText('API 요청에 실패했습니다: 500')).toBeInTheDocument()
    expect(screen.getByText('Noa')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/공간 요약/i)).toHaveTextContent('1'))
  })

  it('always uses the fixed backend user id', async () => {
    window.localStorage.setItem('myclaw-user-id', 'user-from-storage')

    render(<App />)

    await screen.findByText('Hana')

    const calledPaths = vi.mocked(globalThis.fetch).mock.calls.map(([input]) => new URL(String(input), 'https://fe.local').pathname)
    expect(calledPaths).toContain(`/users/${fixedUserId}/agents`)
    expect(calledPaths).not.toContain('/users/user-from-storage/agents')
    expect(calledPaths.every((path) => !path.startsWith('/users/user-from-storage'))).toBe(true)
  })
})
