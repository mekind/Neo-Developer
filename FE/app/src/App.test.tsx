import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the gather-like starter heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /gather-like frontend starter/i })).toBeInTheDocument()
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
    expect(screen.getByText(/milo is the latest character added to the canvas/i)).toBeInTheDocument()
    expect(screen.getAllByText(/nova · scout/i)).toHaveLength(2)
    expect(screen.getAllByText(/milo · spark/i)).toHaveLength(2)
  })
})
