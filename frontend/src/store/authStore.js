import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (user) => set({ user })
    }),
    {
      name: 'auth-storage',
      // Reset state saat rehydrate jika token expired
      onRehydrateStorage: () => (state) => {
        if (state && !state.token) {
          state.clearAuth()
        }
      }
    }
  )
)

export default useAuthStore