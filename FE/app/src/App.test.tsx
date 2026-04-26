import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  } as Response
}

function deferredResponse<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend-kappa-brown-63.vercel.app')
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/items')) {
        return jsonResponse([])
      }

      if (url.endsWith('/agents') && init?.method === 'POST') {
        return jsonResponse({
          id: 'agent-1',
          name: 'Nova',
          archetype: 'maker',
          imageUrl: 'data:image/svg+xml;utf8,avatar',
          createdAt: '2026-04-26T00:00:00.000Z',
          updatedAt: '2026-04-26T00:00:00.000Z',
        })
      }

      return jsonResponse({}, { ok: false, status: 404 })
    })
  })

  it('renders the warm demo-friendly world layout shell', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /편하게 둘러보는 데모 공간/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent(/낯설지 않게 시작하는 안내/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
    await screen.findByRole('list', { name: /live items list/i })
  })

  it('creates an agent through the dialog, shows a pending placeholder, then resolves it on the main screen', async () => {
    const createRequest = deferredResponse<Response>()

    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/items')) {
        return jsonResponse([])
      }

      if (url.endsWith('/agents') && init?.method === 'POST') {
        return createRequest.promise
      }

      return jsonResponse({}, { ok: false, status: 404 })
    })

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /create agent/i }))
    fireEvent.change(screen.getByLabelText(/agent name/i), { target: { value: 'Nova' } })
    fireEvent.change(screen.getByLabelText(/archetype/i), { target: { value: 'maker' } })
    fireEvent.click(screen.getByRole('button', { name: /submit to backend/i }))

    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/nova is pending as a maker/i)
    expect(screen.getByText(/nova is pending while the backend finishes image generation/i)).toBeInTheDocument()
    expect(screen.getAllByText(/nova · maker · pending image generation/i)).toHaveLength(1)

    createRequest.resolve(
      jsonResponse({
        id: 'agent-1',
        name: 'Nova',
        archetype: 'maker',
        imageUrl: 'data:image/svg+xml;utf8,avatar',
        createdAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
      }),
    )

    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/nova joined as a maker/i)
    expect(screen.getByRole('heading', { name: /agents in world: 1/i })).toBeInTheDocument()
    expect(screen.getByText(/nova is the latest fully created agent on the canvas/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^nova · maker$/i)).toHaveLength(2)
  })

  it('appends multiple created agents instead of replacing the roster', async () => {
    let createCount = 0

    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/items')) {
        return jsonResponse([])
      }

      if (url.endsWith('/agents') && init?.method === 'POST') {
        createCount += 1
        const body = JSON.parse(String(init.body)) as { name: string; archetype: string }

        return jsonResponse({
          id: `agent-${createCount}`,
          name: body.name,
          archetype: body.archetype,
          imageUrl: `data:image/svg+xml;utf8,avatar-${createCount}`,
          createdAt: '2026-04-26T00:00:00.000Z',
          updatedAt: '2026-04-26T00:00:00.000Z',
        })
      }

      return jsonResponse({}, { ok: false, status: 404 })
    })

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /create agent/i }))
    fireEvent.change(screen.getByLabelText(/agent name/i), { target: { value: 'Nova' } })
    fireEvent.click(screen.getByRole('button', { name: /submit to backend/i }))
    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/nova joined as a scout/i)

    fireEvent.click(screen.getByRole('button', { name: /create agent/i }))
    fireEvent.change(screen.getByLabelText(/agent name/i), { target: { value: 'Milo' } })
    fireEvent.change(screen.getByLabelText(/archetype/i), { target: { value: 'spark' } })
    fireEvent.click(screen.getByRole('button', { name: /submit to backend/i }))

    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/milo joined as a spark/i)
    expect(screen.getByRole('heading', { name: /agents in world: 2/i })).toBeInTheDocument()
    expect(screen.getAllByText(/^nova · scout$/i)).toHaveLength(2)
    expect(screen.getAllByText(/^milo · spark$/i)).toHaveLength(2)
  })

  it('renders live items from the backend demo slice', async () => {
    vi.mocked(globalThis.fetch).mockImplementationOnce(async () =>
      jsonResponse([
        {
          id: '1',
          name: 'Mock Coffee',
          description: 'A freshly brewed mock coffee',
          price: 4500,
          createdAt: '2026-04-26T00:00:00.000Z',
          updatedAt: '2026-04-26T00:00:00.000Z',
        },
      ]),
    )

    render(<App />)

    const liveItemsList = await screen.findByRole('list', { name: /live items list/i })
    expect(within(liveItemsList).getByText('Mock Coffee')).toBeInTheDocument()
  })

  it('shows an error state when the live items backend request fails', async () => {
    vi.mocked(globalThis.fetch).mockImplementationOnce(async () => jsonResponse({}, { ok: false, status: 500 }))

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
  })

  it('removes the pending placeholder and shows an error when agent creation fails', async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/items')) {
        return jsonResponse([])
      }

      if (url.endsWith('/agents') && init?.method === 'POST') {
        return jsonResponse({}, { ok: false, status: 500 })
      }

      return jsonResponse({}, { ok: false, status: 404 })
    })

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /create agent/i }))
    fireEvent.change(screen.getByLabelText(/agent name/i), { target: { value: 'Nova' } })
    fireEvent.click(screen.getByRole('button', { name: /submit to backend/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
    expect(screen.queryByText(/nova joined as/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/nova is pending/i)).not.toBeInTheDocument()
  })

  it('shows a configuration error when the API base URL is missing', async () => {
    vi.unstubAllEnvs()

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing VITE_API_BASE_URL configuration.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
