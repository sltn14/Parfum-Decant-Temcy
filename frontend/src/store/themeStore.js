import { create } from 'zustand'

const KEY = 'theme'

// Pilihan tersimpan -> kalau belum ada, ikut pengaturan OS
const readInitial = () => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage bisa diblokir */ }
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch { return 'dark' }
}

const apply = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
}

const useThemeStore = create((set, get) => ({
  theme: readInitial(),
  setTheme: (theme) => {
    apply(theme)
    try { localStorage.setItem(KEY, theme) } catch { /* abaikan */ }
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
}))

apply(useThemeStore.getState().theme)

export default useThemeStore
