import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
    }
  },
}))

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', {
      name: /hello there!/i,
    })
    
    expect(heading).toBeInTheDocument()
  })

  it('renders the welcome message', () => {
    render(<Home />)
    
    const welcomeMessage = screen.getByText(/welcome to codex bootstrap/i)
    
    expect(welcomeMessage).toBeInTheDocument()
  })

  it('renders the get started button', () => {
    render(<Home />)
    
    const button = screen.getByRole('button', {
      name: /get started/i,
    })
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('btn', 'btn-primary')
  })

  it('renders the navigation bar', () => {
    render(<Home />)
    
    const navbar = screen.getByText(/codex bootstrap/i)
    
    expect(navbar).toBeInTheDocument()
  })
})
