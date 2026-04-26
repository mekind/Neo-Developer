import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders a compact product-style shell', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /school commons/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent(/agents/i)
    expect(screen.getByLabelText(/room summary/i)).toHaveTextContent(/live/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
  })

  it('creates a character from the side panel and reflects it in the world UI', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Nova' } })
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'maker' } })
    fireEvent.click(screen.getByRole('button', { name: /add agent/i }))

    expect(screen.getByLabelText(/current character summary/i)).toHaveTextContent(/nova/i)
    expect(screen.getByRole('heading', { name: /1 online/i })).toBeInTheDocument()
    expect(screen.getAllByText(/nova/i).length).toBeGreaterThan(1)
  })

  it('appends multiple created characters instead of replacing the current roster', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Nova' } })
    fireEvent.click(screen.getByRole('button', { name: /add agent/i }))

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Milo' } })
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'spark' } })
    fireEvent.click(screen.getByRole('button', { name: /add agent/i }))

    expect(screen.getByRole('heading', { name: /2 online/i })).toBeInTheDocument()
    expect(screen.getAllByText(/^Milo$/i).length).toBeGreaterThan(1)
    expect(screen.getAllByText(/scout/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/spark/i).length).toBeGreaterThan(0)
  })
})
