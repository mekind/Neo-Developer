import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the warm demo-friendly heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /편하게 둘러보는 데모 공간/i })).toBeInTheDocument()
  })
})
