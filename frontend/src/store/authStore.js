import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token, remember = false) => {
    localStorage.removeItem('auth-storage')
    sessionStorage.removeItem('auth-session')

    if (remember) {
      localStorage.setItem('auth-storage', JSON.stringify({ user, token }))
    } else {
      sessionStorage.setItem('auth-session', JSON.stringify({ user, token }))
    }

    set({ user, token, isAuthenticated: true })
  },

  clearAuth: () => {
    localStorage.removeItem('auth-storage')
    sessionStorage.removeItem('auth-session')
    set({ user: null, token: null, isAuthenticated: false })
  },

  updateUser: (updatedUser) => {
    set((state) => {
      const newUser = { ...state.user, ...updatedUser }

      // Sync ke storage yang aktif
      const local = localStorage.getItem('auth-storage')
      if (local) {
        try {
          const parsed = JSON.parse(local)
          localStorage.setItem('auth-storage', JSON.stringify({
            ...parsed,
            user: newUser
          }))
        } catch {}
      }

      const session = sessionStorage.getItem('auth-session')
      if (session) {
        try {
          const parsed = JSON.parse(session)
          sessionStorage.setItem('auth-session', JSON.stringify({
            ...parsed,
            user: newUser
          }))
        } catch {}
      }

      return { user: newUser }
    })
  }
}))

export default useAuthStore