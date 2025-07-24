import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppState {
  theme: string
  isLoading: boolean
  user: {
    id: string | null
    name: string | null
    email: string | null
  }
  setTheme: (theme: string) => void
  setLoading: (loading: boolean) => void
  setUser: (user: { id: string; name: string; email: string }) => void
  clearUser: () => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'corporate',
        isLoading: false,
        user: {
          id: null,
          name: null,
          email: null,
        },
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
        setUser: (user) => set({ user }, false, 'setUser'),
        clearUser: () => 
          set(
            { user: { id: null, name: null, email: null } },
            false,
            'clearUser'
          ),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ theme: state.theme, user: state.user }),
      }
    ),
    {
      name: 'app-store',
    }
  )
)
