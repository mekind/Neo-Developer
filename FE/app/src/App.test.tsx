import { fireEvent, render, screen } from '@testing-library/react'
import { within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

vi.mock('@/game/WorldCanvas', () => ({
  WorldCanvas: ({
    characters,
    currentCharacter,
    interactionTarget,
    lastInteractionMessage,
    onCharactersChange,
    onInteractionMessage,
    playerStatusCopy,
    interactionStatusCopy,
    phaserStatusCopy,
  }: {
    characters: Array<{ id: string; name: string; archetype: string; x: number; y: number }>
    currentCharacter: { id: string; name: string; x: number; y: number } | null
    interactionTarget: { id: string; name: string } | null
    lastInteractionMessage: string | null
    onCharactersChange: (characters: Array<{ id: string; name: string; archetype: string; x: number; y: number }>) => void
    onInteractionMessage: (message: string) => void
    playerStatusCopy: string
    interactionStatusCopy: string
    phaserStatusCopy: string
  }) => (
    <div aria-label="Phaser map viewport">
      <h2>Spawned avatars: {characters.length}</h2>
      <p>{playerStatusCopy}</p>
      <p>{currentCharacter ? interactionStatusCopy : '첫 번째 캐릭터를 만들면 월드에 바로 반영됩니다.'}</p>
      <p>{phaserStatusCopy}</p>
      <p>{lastInteractionMessage ?? 'No interaction triggered yet.'}</p>
      {interactionTarget ? <p>Distance to {interactionTarget.name}: 20px</p> : null}
      <button
        type="button"
        onClick={() => {
          const player = characters.at(-1)
          if (!player) return
          onCharactersChange(
            characters.map((character, index) =>
              index === characters.length - 1 ? { ...character, x: character.x - 120 } : character,
            ),
          )
        }}
      >
        Mock move left
      </button>
      <button
        type="button"
        onClick={() => {
          const player = currentCharacter
          const target = interactionTarget
          if (!player || !target) return
          onInteractionMessage(`${player.name} greeted ${target.name}.`)
        }}
      >
        Mock interact
      </button>
    </div>
  ),
}))

describe('App', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-kappa-brown-63.vercel.app')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)
  })

  it('renders the warm demo-friendly world layout shell', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /편하게 둘러보는 데모 공간/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent(/낯설지 않게 시작하는 안내/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    await screen.findByRole('list', { name: /live items list/i })
  })

  it('creates a character from the side panel and reflects it in the world UI', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Nova' } })
    fireEvent.change(screen.getByLabelText(/archetype/i), { target: { value: 'maker' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(screen.getByLabelText(/current character summary/i)).toHaveTextContent(/nova joined as a maker/i)
    expect(screen.getByRole('heading', { name: /spawned avatars: 1/i })).toBeInTheDocument()
    expect(screen.getByText(/nova · maker/i)).toBeInTheDocument()
    await screen.findByRole('list', { name: /live items list/i })
  })

  it('appends multiple created characters instead of replacing the current roster', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Nova' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Milo' } })
    fireEvent.change(screen.getByLabelText(/archetype/i), { target: { value: 'spark' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(screen.getByRole('heading', { name: /spawned avatars: 2/i })).toBeInTheDocument()
    expect(screen.getByText(/controlling milo at \(1320, 700\)/i)).toBeInTheDocument()
    expect(screen.getByText(/nova · scout/i)).toBeInTheDocument()
    expect(screen.getByText(/milo · spark/i)).toBeInTheDocument()
    await screen.findByRole('list', { name: /live items list/i })
  })

  it('renders live items from the backend demo slice', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: '1',
          name: 'Mock Coffee',
          description: 'A freshly brewed mock coffee',
          price: 4500,
          createdAt: '2026-04-26T00:00:00.000Z',
          updatedAt: '2026-04-26T00:00:00.000Z',
        },
      ],
    } as Response)

    render(<App />)

    const liveItemsList = await screen.findByRole('list', { name: /live items list/i })
    expect(within(liveItemsList).getByText('Mock Coffee')).toBeInTheDocument()
  })

  it('shows an error state when the backend request fails', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
  })

  it('shows a configuration error when the API base URL is missing', async () => {
    vi.unstubAllEnvs()

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing VITE_API_BASE_URL configuration.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('moves the latest created character and unlocks interaction feedback nearby', async () => {
    render(<App />)
    await screen.findByRole('list', { name: /live items list/i })

    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Nova' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Milo' } })
    fireEvent.change(screen.getByLabelText(/archetype/i), { target: { value: 'spark' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    fireEvent.click(screen.getByRole('button', { name: /mock move left/i }))

    expect(screen.getByText(/controlling milo at \(1200, 700\)/i)).toBeInTheDocument()
    expect(screen.getByText(/press e near nova to interact/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /mock interact/i }))

    expect(screen.getByText(/milo greeted nova/i)).toBeInTheDocument()
    expect(screen.getByText(/distance to nova: 20px/i)).toBeInTheDocument()
    expect(screen.getByText(/phaser drives the map camera, movement, and proximity interaction/i)).toBeInTheDocument()
  })
})
