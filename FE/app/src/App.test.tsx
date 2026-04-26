import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'

import type { LpcSpriteBundle } from '@/game/lpcSprite'
import App from './App'

type AgentPayload = {
  id: string
  name?: string
  imageAsset?: string | null
  characterPngUrl?: string | null
  frameMap?: LpcSpriteBundle['frameMap'] | null
  creditsText?: string | null
}

const apiFrameMap: LpcSpriteBundle['frameMap'] = {
  frameSize: 64,
  animations: {
    walk_n: { y: 512, frames: [1, 2, 3, 4, 5, 6, 7, 8], fps: 8 },
    walk_w: { y: 576, frames: [1, 2, 3, 4, 5, 6, 7, 8], fps: 8 },
    walk_s: { y: 640, frames: [1, 2, 3, 4, 5, 6, 7, 8], fps: 8 },
    walk_e: { y: 704, frames: [1, 2, 3, 4, 5, 6, 7, 8], fps: 8 },
    idle_n: { y: 1408, frames: [0, 0, 1], fps: 4 },
    idle_w: { y: 1472, frames: [0, 0, 1], fps: 4 },
    idle_s: { y: 1536, frames: [0, 0, 1], fps: 4 },
    idle_e: { y: 1600, frames: [0, 0, 1], fps: 4 },
  },
}

const backendAgents: AgentPayload[] = [
  {
    id: 'mentor-hana',
    name: 'Hana',
    characterPngUrl: 'https://cdn.example.com/hana-character.png',
    frameMap: apiFrameMap,
    creditsText: 'Hana credits from API',
  },
]

const lpcSpriteBundle: LpcSpriteBundle = {
  bundleId: 'cafe-bot',
  characterPngUrl: '/lpc-character-pipeline/.example/cafe-bot/character.png',
  creditsText: 'Made with LPC assets',
  frameMap: apiFrameMap,
}

function installFetchMock(overrides: Record<string, { ok?: boolean; status?: number; json: unknown }> = {}) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
    const pathname = new URL(url, 'https://fe.local').pathname
    const payload = overrides[pathname] ?? { ok: true, status: 200, json: backendAgents }

    return {
      ok: payload.ok ?? true,
      status: payload.status ?? 200,
      json: async () => payload.json,
    } as Response
  })
}

vi.mock('@/hooks/useLpcSpriteBundle', () => ({
  useLpcSpriteBundle: () => ({
    catalog: { 'cafe-bot': lpcSpriteBundle },
    creditsText: lpcSpriteBundle.creditsText,
    errorMessage: null,
  }),
}))

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
            imageSrc: 'https://cdn.example.com/hana-character.png',
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

  it('renders the shell with the game viewport, seeded dummy npcs, and combined LPC credits', async () => {
    render(<App />)

<<<<<<< HEAD
    expect(screen.getByRole('heading', { name: /스쿨 커먼즈/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Phaser map viewport/i)).toBeInTheDocument()
    expect(await screen.findByText('Hana')).toBeInTheDocument()
    expect(await screen.findByText('Haru')).toBeInTheDocument()
    expect(screen.getByText('Miso')).toBeInTheDocument()
    expect(screen.getByText(/made with lpc assets/i)).toBeInTheDocument()
    expect(screen.getByText(/hana credits from api/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/공간 요약/i)).toHaveTextContent('4'))
=======
    expect(screen.getByRole('heading', { name: /myclaw/i })).toBeInTheDocument()
    expect(screen.getByText(/controlling you at \(12%, 32%\)/i)).toBeInTheDocument()
    expect(screen.getByText(/minimap visible/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /hana avatar/i })).toBeInTheDocument()
>>>>>>> 672c600 (Rename the room title to Myclaw)
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

    expect(await screen.findByRole('dialog', { name: /hana와 대화하기/i })).toBeInTheDocument()
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

  it('shows an error state when the backend request fails but still keeps dummy npcs', async () => {
    installFetchMock({ '/agents': { ok: false, status: 500, json: {} } })

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
    expect(await screen.findByText('Haru')).toBeInTheDocument()
    expect(screen.getByText('Miso')).toBeInTheDocument()
  })
})
