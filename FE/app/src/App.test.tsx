import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the gather-like world layout shell', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /gather-like world layout/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent(/sidebar ui placeholder/i)
    expect(screen.getByLabelText(/world stage/i)).toBeInTheDocument()
  })
})
