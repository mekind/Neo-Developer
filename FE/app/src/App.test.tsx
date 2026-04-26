import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the gather-like starter heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /gather-like frontend starter/i })).toBeInTheDocument()
  })
})
