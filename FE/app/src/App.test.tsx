import { act, fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the gather-like world layout shell', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /gather-like world layout/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent(/sidebar ui placeholder/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
  })

  it('creates a character from the side panel and reflects it in the world UI', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Nova' } })
    fireEvent.change(screen.getByLabelText(/archetype/i), { target: { value: 'maker' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(screen.getByLabelText(/current character summary/i)).toHaveTextContent(/nova joined as a maker/i)
    expect(screen.getByRole('heading', { name: /spawned avatars: 1/i })).toBeInTheDocument()
    expect(screen.getAllByText(/nova · maker/i)).toHaveLength(2)
  })

  it('appends multiple created characters instead of replacing the current roster', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Nova' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Milo' } })
    fireEvent.change(screen.getByLabelText(/archetype/i), { target: { value: 'spark' } })
    fireEvent.click(screen.getByRole('button', { name: /create character/i }))

    expect(screen.getByRole('heading', { name: /spawned avatars: 2/i })).toBeInTheDocument()
    expect(screen.getByText(/controlling milo at \(340, 180\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/nova · scout/i)).toHaveLength(2)
    expect(screen.getAllByText(/milo · spark/i)).toHaveLength(2)
  })

  it('moves the latest created character and unlocks interaction feedback nearby', () => {
    vi.useFakeTimers()

    try {
      render(<App />)

      fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Nova' } })
      fireEvent.click(screen.getByRole('button', { name: /create character/i }))

      fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Milo' } })
      fireEvent.change(screen.getByLabelText(/archetype/i), { target: { value: 'spark' } })
      fireEvent.click(screen.getByRole('button', { name: /create character/i }))

      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      act(() => {
        vi.advanceTimersByTime(180)
      })
      fireEvent.keyUp(window, { key: 'ArrowLeft' })

      expect(screen.getByText(/controlling milo at \(268, 180\)/i)).toBeInTheDocument()
      expect(screen.getByText(/press e near nova to interact/i)).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'e' })

      expect(screen.getByText(/milo greeted nova/i)).toBeInTheDocument()
      expect(screen.getByText(/distance to nova: 108px/i)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
