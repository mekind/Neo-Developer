import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
]

function installFetchMock(overrides: Record<string, { ok?: boolean; status?: number; json: unknown }> = {}) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    const pathname = new URL(url).pathname
    const payload = overrides[pathname] ?? { ok: true, status: 200, json: backendAgents }

    return {
      ok: payload.ok ?? true,
      status: payload.status ?? 200,
      json: async () => payload.json,
    } as Response
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
            imageSrc: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22/%3E',
          })
        }
      >
        Simulate interaction
      </button>
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

  it('renders the shell with the game viewport and seeded dummy npcs', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /스쿨 커먼즈/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Phaser map viewport/i)).toBeInTheDocument()
    expect(await screen.findByText('Hana')).toBeInTheDocument()
    expect(await screen.findByText('Haru')).toBeInTheDocument()
    expect(screen.getByText('Miso')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/공간 요약/i)).toHaveTextContent('4'))
  })

  it('adds a local npc from the dialog', async () => {
    render(<App />)
    await screen.findByText('Haru')

    fireEvent.click(screen.getByRole('button', { name: /에이전트 추가/i }))
    const dialog = screen.getByRole('dialog', { name: /에이전트 npc 추가|에이전트 NPC 추가/i })
    fireEvent.change(within(dialog).getByLabelText(/이름/i), { target: { value: 'Warm Guide' } })
    fireEvent.change(within(dialog).getByLabelText(/페르소나/i), { target: { value: 'Warm school guide' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /^에이전트 추가$/i }))

    await waitFor(() => expect(screen.getByText('Warm Guide')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByLabelText(/공간 요약/i)).toHaveTextContent('5'))
  })

  it('opens chat from the header trigger', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /npc 대화 열기/i }))

    expect(screen.getByRole('dialog', { name: /hana와 대화하기/i })).toBeInTheDocument()
  })

  it('opens chat from the game interaction callback', async () => {
    render(<App />)
    await screen.findByText('Hana')

    fireEvent.click(screen.getByRole('button', { name: /simulate interaction/i }))

    expect(screen.getByRole('dialog', { name: /hana와 대화하기/i })).toBeInTheDocument()
  })

  it('shows an error state when the backend request fails but still keeps dummy npcs', async () => {
    installFetchMock({ '/agents': { ok: false, status: 500, json: {} } })

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
    expect(await screen.findByText('Haru')).toBeInTheDocument()
    expect(screen.getByText('Miso')).toBeInTheDocument()
  })
})
