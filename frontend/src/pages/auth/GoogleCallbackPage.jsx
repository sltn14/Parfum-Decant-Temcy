import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    console.log('Token:', token) // debug
    console.log('Error:', error) // debug

    if (error) {
      toast.error('Login dengan Google gagal')
      navigate('/login')
      return
    }

    if (token) {
      // Ambil data user dengan token
      const fetchUser = async () => {
        try {
	  // Set token dulu ke localStorage sebelum request
          localStorage.setItem('auth-storage', JSON.stringify({
          state: { token, user: null, isAuthenticated: false }
        }))

          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })

	  console.log('User data:', res.data.user) // debug
          setAuth(res.data.user, token)
          toast.success('Login berhasil!')
          if (res.data.user.role === 'admin') navigate('/admin')
          else navigate('/')
        } catch {
	  console.error('Fetch user error:', err) // debug
          toast.error('Gagal mengambil data user')
          navigate('/login')
        }
      }
      fetchUser()
    } else {
      console.log('No token found in URL') // debug
      navigate('/login')
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
        <p style={{ color: 'var(--text-muted)' }}>Memproses login Google...</p>
      </div>
    </div>
  )
}