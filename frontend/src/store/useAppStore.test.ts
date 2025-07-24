import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '@/store/useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.getState().setTheme('corporate')
    useAppStore.getState().setLoading(false)
    useAppStore.getState().clearUser()
  })

  it('should have initial state', () => {
    const { result } = renderHook(() => useAppStore())
    
    expect(result.current.theme).toBe('corporate')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user.id).toBeNull()
    expect(result.current.user.name).toBeNull()
    expect(result.current.user.email).toBeNull()
  })

  it('should update theme', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(result.current.theme).toBe('dark')
  })

  it('should update loading state', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.setLoading(true)
    })
    
    expect(result.current.isLoading).toBe(true)
  })

  it('should set and clear user', () => {
    const { result } = renderHook(() => useAppStore())
    
    const testUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    }
    
    act(() => {
      result.current.setUser(testUser)
    })
    
    expect(result.current.user).toEqual(testUser)
    
    act(() => {
      result.current.clearUser()
    })
    
    expect(result.current.user.id).toBeNull()
    expect(result.current.user.name).toBeNull()
    expect(result.current.user.email).toBeNull()
  })
})
