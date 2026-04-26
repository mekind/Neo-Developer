import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-kappa-brown-63.vercel.app')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('renders a compact product-style shell', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /스쿨 커먼즈/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent(/agents/i)
    expect(screen.getByRole('button', { name: /open persona dialog/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/room summary/i)).toHaveTextContent(/live/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    await screen.findByRole('list', { name: /live items list/i })
  })

  it('creates a character from the persona dialog and reflects it in the world UI', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'agent-1',
          name: 'Nova Guide',
          archetype: 'maker',
          personaSummary: 'Warm school guide',
          backstoryPrompt: 'Helps every newcomer settle in.',
          createdAt: '2026-04-26T00:00:00.000Z',
        }),
      } as Response)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Warm school guide' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), {
      target: { value: 'Helps every newcomer settle in.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/nova guide/i)
    expect(screen.getByRole('heading', { name: /1 online/i })).toBeInTheDocument()
    expect(screen.getAllByText(/nova guide/i).length).toBeGreaterThan(1)
    await screen.findByRole('list', { name: /live items list/i })
  })

  it('appends multiple created characters instead of replacing the current roster', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'agent-1',
          name: 'Nova Scout',
          archetype: 'scout',
          personaSummary: 'Nova scout',
          backstoryPrompt: 'Explores the room.',
          createdAt: '2026-04-26T00:00:00.000Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'agent-2',
          name: 'Milo Spark',
          archetype: 'spark',
          personaSummary: 'Milo spark',
          backstoryPrompt: 'Energizes the room.',
          createdAt: '2026-04-26T00:00:00.000Z',
        }),
      } as Response)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Nova scout' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Explores the room.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))
    await screen.findByRole('heading', { name: /1 online/i })

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Milo spark' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Energizes the room.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(await screen.findByRole('heading', { name: /2 online/i })).toBeInTheDocument()
    expect(screen.getByText(/milo spark · 340, 180/i)).toBeInTheDocument()
    expect(screen.getAllByText(/scout/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/spark/i).length).toBeGreaterThan(0)
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

  it('shows submit errors inside the persona dialog when creation fails', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Warm guide' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Supports the class.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
  })

  it('shows a configuration error when the API base URL is missing', async () => {
    vi.unstubAllEnvs()

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing VITE_API_BASE_URL configuration.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('moves the latest created character and unlocks interaction feedback nearby', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'agent-1',
          name: 'Nova Scout',
          archetype: 'scout',
          personaSummary: 'Nova scout',
          backstoryPrompt: 'Explores the room.',
          createdAt: '2026-04-26T00:00:00.000Z',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'agent-2',
          name: 'Milo Spark',
          archetype: 'spark',
          personaSummary: 'Milo spark',
          backstoryPrompt: 'Energizes the room.',
          createdAt: '2026-04-26T00:00:00.000Z',
        }),
      } as Response)

    render(<App />)
    await screen.findByRole('list', { name: /live items list/i })

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Nova scout' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Explores the room.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))
    await screen.findByRole('heading', { name: /1 online/i })

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Milo spark' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Energizes the room.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))
    await screen.findByRole('heading', { name: /2 online/i })

    vi.useFakeTimers()
    try {
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      act(() => {
        vi.advanceTimersByTime(180)
      })
      fireEvent.keyUp(window, { key: 'ArrowLeft' })

      expect(screen.getByText(/milo spark · 268, 180/i)).toBeInTheDocument()
      expect(screen.getByText(/press e near nova scout/i)).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'e' })

      expect(screen.getByText(/milo spark greeted nova scout/i)).toBeInTheDocument()
      expect(screen.getByText(/distance to nova scout: 108px/i)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
