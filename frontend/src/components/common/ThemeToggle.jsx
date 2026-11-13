import { Sun, Moon } from 'lucide-react'
import useThemeStore from '../../store/themeStore'

export default function ThemeToggle({ size = 38 }) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'
  return (
    <button type="button" onClick={toggleTheme}
      aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      style={{
        width: size, height: size, borderRadius: 'var(--radius-full)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', background: 'transparent',
        border: '1px solid var(--border-default)', cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}>
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
