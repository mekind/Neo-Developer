import { render, screen, within } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-kappa-brown-63.vercel.app')
  })

  it('renders the gather-like starter heading', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
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

    expect(screen.getByRole('heading', { name: /gather-like frontend starter/i })).toBeInTheDocument()

    const liveItemsList = await screen.findByRole('list', { name: /live items list/i })
    expect(within(liveItemsList).getByText('Mock Coffee')).toBeInTheDocument()
  })

  it('shows an error state when the backend request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
  })

  it('shows a configuration error when the API base URL is missing', async () => {
    vi.unstubAllEnvs()
    vi.spyOn(globalThis, 'fetch')

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing VITE_API_BASE_URL configuration.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
