import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error || !token) {
      toast.error('Login dengan Google gagal')
      navigate('/login')
      return
    }

    const fetchUser = async () => {
      try {
        clearAuth()

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (!response.ok) throw new Error('Failed')

        const data = await response.json()
        const user = data.user

        // Google login selalu pakai remember me
        setAuth(user, token, true)

        toast.success(`Halo, ${user.full_name}!`)

        setTimeout(() => {
          window.location.href = user.role === 'admin' ? '/admin' : '/'
        }, 300)

      } catch (err) {
        toast.error('Gagal login dengan Google')
        navigate('/login')
      }
    }

    fetchUser()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(240,46,41,0.06) 0%, transparent 60%)'
      }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid var(--border-default)',
          borderTopColor: 'var(--accent-red)',
          animation: 'rotate-slow 0.8s linear infinite',
          margin: '0 auto 20px'
        }} />
        <div style={{
          fontSize: '0.72rem', fontWeight: 800,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--text-muted)'
        }}>MEMPROSES LOGIN GOOGLE...</div>
      </div>
    </div>
  )
}