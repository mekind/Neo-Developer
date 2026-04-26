import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'

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
    expect(screen.getAllByText(/nova · maker/i)).toHaveLength(2)
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
    expect(screen.getByText(/milo is the latest character added to the canvas/i)).toBeInTheDocument()
    expect(screen.getAllByText(/nova · scout/i)).toHaveLength(2)
    expect(screen.getAllByText(/milo · spark/i)).toHaveLength(2)
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
})
