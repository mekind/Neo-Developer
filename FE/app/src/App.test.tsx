import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'
import { resetAgentSessionForTests } from '@/services/agents'

const backendAgents = [
  {
    id: 'mentor-hana',
    name: 'Hana',
    persona: { summary: 'Warm school guide' },
    imageAsset: 'lpc:cafe-bot',
    characterPngUrl: null,
    frameMap: null,
    creditsText: 'Hana credits from API',
  },
]

const fixedUserId = '5c4a5a9b-ac4f-4e2f-a7ba-4d7e93bd2e86'
const lpcSpriteBundle = {
  catalog: {},
  creditsText: 'Made with LPC assets',
  errorMessage: null,
}

function installFetchMock(overrides: Record<string, { ok?: boolean; status?: number; json: unknown }> = {}) {
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
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => (key === 'myclaw-user-id' ? fixedUserId : store.get(key) ?? null),
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => void store.clear(),
    },
    configurable: true,
  })
}

vi.mock('@/hooks/useLpcSpriteBundle', () => ({
  useLpcSpriteBundle: () => ({
    catalog: lpcSpriteBundle.catalog,
    creditsText: lpcSpriteBundle.creditsText,
    errorMessage: lpcSpriteBundle.errorMessage,
  }),
}))

vi.mock('@/game/WorldCanvas', () => ({
  WorldCanvas: ({ onAgentInteraction, focusRequest }: { onAgentInteraction: (agent: { id: string; label: string; usesPlaceholder: boolean; imageSrc: string }) => void; focusRequest: { agentId: string; requestId: number } | null }) => (
    <div aria-label="Phaser map viewport">
      <p>{focusRequest ? `Focus target: ${focusRequest.agentId}` : 'No focus target'}</p>
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
    await waitFor(() => expect(screen.getByLabelText(/공간 요약/i)).toHaveTextContent('2'))
  })

  it('closes the add-agent dialog with Escape', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /에이전트 추가/i }))
    expect(screen.getByRole('dialog', { name: /에이전트 npc 추가|에이전트 NPC 추가/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /에이전트 npc 추가|에이전트 NPC 추가/i })).not.toBeInTheDocument())
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

  it('requests focus movement when a sidebar agent is clicked', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /hana/i }))

    expect(screen.getByText('Focus target: mentor-hana')).toBeInTheDocument()
  })

  it('opens chat from the header trigger and sends an invoke request', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /npc 대화 열기/i }))
    expect(await screen.findByRole('dialog', { name: /hana와 대화하기/i })).toBeInTheDocument()

    const dialog = await screen.findByRole('dialog', { name: /hana와 대화하기/i })
    fireEvent.change(within(dialog).getByLabelText(/메시지/i), { target: { value: '안녕!' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /보내기/i }))

    await waitFor(() => expect(screen.getByText('안녕하세요! 저는 하나예요.')).toBeInTheDocument())
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
})
