import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

const backendAgents = [
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

describe('App', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-kappa-brown-63.vercel.app')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => backendAgents,
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('renders the compact backend-driven shell', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /스쿨 커먼즈/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent(/agents/i)
    expect(screen.getByLabelText(/room summary/i)).toHaveTextContent(/live/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /hana avatar/i })).toBeInTheDocument()
  })

  it('renders a simple backend agent roster', async () => {
    render(<App />)

    const roster = await screen.findByRole('list', { name: /backend agent list/i })
    expect(within(roster).getByText('Hana')).toBeInTheDocument()
    expect(within(roster).getByText('Min')).toBeInTheDocument()
  })

  it('falls back to the agent id when the backend omits a display name', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'mystery-agent',
          imageAsset: null,
        },
      ],
    } as Response)

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
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'unsafe-agent',
          name: 'Unsafe',
          imageAsset: 'ftp://example.com/avatar.png',
        },
      ],
    } as Response)

    render(<App />)

    const fallbackAvatar = await screen.findByRole('img', { name: /unsafe avatar/i })
    expect(fallbackAvatar.getAttribute('src')).toContain('data:image/svg+xml')
  })

  it('shows an error state when the backend request fails', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(<App />)

    const alerts = await screen.findAllByRole('alert')
    expect(alerts[0]).toHaveTextContent('API request failed: 500')
  })

  it('shows a configuration error when the API base URL is missing', async () => {
    vi.unstubAllEnvs()

    render(<App />)

    const alerts = await screen.findAllByRole('alert')
    expect(alerts[0]).toHaveTextContent('Missing VITE_API_BASE_URL configuration.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
