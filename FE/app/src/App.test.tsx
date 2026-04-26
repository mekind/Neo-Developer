import { fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
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
          name: 'Warm School',
          archetype: 'maker',
          personaSummary: 'Warm school guide',
          backstoryPrompt: 'Helps every newcomer settle in.',
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
    expect(screen.getByRole('button', { name: /open persona dialog/i })).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Warm school guide' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), {
      target: { value: 'Helps every newcomer settle in.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/warm school is pending as a scout/i)
    expect(screen.getByText(/wait for backend completion before movement and interaction unlock/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /spawned avatars: 1/i })).toBeInTheDocument()
    expect(screen.getAllByText(/warm school · scout · pending image generation/i)).toHaveLength(1)

    createRequest.resolve(
      jsonResponse({
        id: 'agent-1',
        name: 'Warm School',
        archetype: 'maker',
        personaSummary: 'Warm school guide',
        backstoryPrompt: 'Helps every newcomer settle in.',
        imageUrl: 'data:image/svg+xml;utf8,avatar',
        createdAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
      }),
    )

    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/warm school joined as a maker/i)
    expect(screen.getByText(/controlling warm school at \(160, 180\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^warm school · maker$/i)).toHaveLength(2)
  })

  it('appends multiple created characters instead of replacing the current roster', async () => {
    let createCount = 0

    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/items')) {
        return jsonResponse([])
      }

      if (url.endsWith('/agents') && init?.method === 'POST') {
        createCount += 1
        const body = JSON.parse(String(init.body)) as { personaSummary: string; backstoryPrompt: string }

        const responses = [
          {
            id: 'agent-1',
            name: 'Nova Scout',
            archetype: 'scout',
            personaSummary: body.personaSummary,
            backstoryPrompt: body.backstoryPrompt,
            imageUrl: 'data:image/svg+xml;utf8,avatar-1',
            createdAt: '2026-04-26T00:00:00.000Z',
            updatedAt: '2026-04-26T00:00:00.000Z',
          },
          {
            id: 'agent-2',
            name: 'Milo Spark',
            archetype: 'spark',
            personaSummary: body.personaSummary,
            backstoryPrompt: body.backstoryPrompt,
            imageUrl: 'data:image/svg+xml;utf8,avatar-2',
            createdAt: '2026-04-26T00:00:00.000Z',
            updatedAt: '2026-04-26T00:00:00.000Z',
          },
        ]

        return jsonResponse(responses[createCount - 1])
      }

      return jsonResponse({}, { ok: false, status: 404 })
    })

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Nova scout' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Explores the room.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))
    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/nova scout joined as a scout/i)

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Milo spark' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Energizes the room.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(await screen.findByLabelText(/current character summary/i)).toHaveTextContent(/milo spark joined as a spark/i)
    expect(screen.getByRole('heading', { name: /spawned avatars: 2/i })).toBeInTheDocument()
    expect(screen.getByText(/controlling milo spark at \(340, 180\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^nova scout · scout$/i)).toHaveLength(2)
    expect(screen.getAllByText(/^milo spark · spark$/i)).toHaveLength(2)
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

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Warm guide' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Supports the class.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('API request failed: 500')
    expect(screen.queryByText(/pending as/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /spawned avatars: 0/i })).toBeInTheDocument()
  })

  it('shows a configuration error when the API base URL is missing', async () => {
    vi.unstubAllEnvs()

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing VITE_API_BASE_URL configuration.')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('keeps the latest created character as the active world agent after multiple creations', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'agent-1',
          name: 'Nova Scout',
          archetype: 'scout',
          personaSummary: 'Nova scout',
          backstoryPrompt: 'Explores the room.',
          imageUrl: 'data:image/svg+xml;utf8,avatar-1',
          createdAt: '2026-04-26T00:00:00.000Z',
          updatedAt: '2026-04-26T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'agent-2',
          name: 'Milo Spark',
          archetype: 'spark',
          personaSummary: 'Milo spark',
          backstoryPrompt: 'Energizes the room.',
          imageUrl: 'data:image/svg+xml;utf8,avatar-2',
          createdAt: '2026-04-26T00:00:00.000Z',
          updatedAt: '2026-04-26T00:00:00.000Z',
        }),
      )

    render(<App />)
    await screen.findByRole('list', { name: /live items list/i })

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Nova scout' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Explores the room.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))
    await screen.findByRole('heading', { name: /spawned avatars: 1/i })

    fireEvent.click(screen.getByRole('button', { name: /open persona dialog/i }))
    fireEvent.change(screen.getByLabelText(/persona summary/i), { target: { value: 'Milo spark' } })
    fireEvent.change(screen.getByLabelText(/backstory \/ prompt/i), { target: { value: 'Energizes the room.' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(await screen.findByRole('heading', { name: /spawned avatars: 2/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/current character summary/i)).toHaveTextContent(/milo spark joined as a spark/i)
    expect(screen.getByText(/controlling milo spark at \(340, 180\)\./i)).toBeInTheDocument()
    expect(screen.getByText(/move closer to another generated character to interact/i)).toBeInTheDocument()
  })
})
