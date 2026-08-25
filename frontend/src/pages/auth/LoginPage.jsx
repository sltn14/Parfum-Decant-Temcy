import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      setAuth(res.data.user, res.data.token)
      toast.success('Login berhasil!')
      if (res.data.user.role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.88rem',
    outline: 'none', fontFamily: 'var(--font-sans)',
    fontWeight: 500, transition: 'border-color 0.2s ease'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary)'
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 32px', position: 'relative'
      }}>
        {/* BG */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 30% 50%, rgba(240,46,41,0.08) 0%, transparent 60%)'
        }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 48, textDecoration: 'none'
          }}>
            <div style={{
              width: 32, height: 32, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img src="/logo.png" alt="DT"
                style={{
                  width: 100, height: 100,
                  filter: 'brightness(0) invert(1)',
                  transform: 'scale(2.2)', objectFit: 'contain'
                }}
              />
            </div>
            <span style={{
              fontWeight: 900, fontSize: '0.82rem',
              letterSpacing: '0.12em', textTransform: 'uppercase'
            }}>
              <span style={{ color: 'var(--text-primary)' }}>DECANT </span>
              <span style={{ color: 'var(--accent-red)' }}>TEMCY</span>
            </span>
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{
              fontSize: '2rem', fontWeight: 900,
              letterSpacing: '-0.03em', textTransform: 'uppercase',
              marginBottom: 8
            }}>MASUK</h1>
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400
            }}>
              Belum punya akun?{' '}
              <Link to="/register" style={{
                color: 'var(--accent-red)', fontWeight: 700,
                textDecoration: 'none'
              }}>Daftar sekarang</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: '0.65rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 8
              }}>Email</label>
              <input
                type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="email@example.com"
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: 'block', fontSize: '0.65rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 8
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="Masukkan password"
                  required
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', cursor: 'pointer'
                  }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div style={{ textAlign: 'right', marginBottom: 28 }}>
              <Link to="/forgot-password" style={{
                fontSize: '0.75rem', fontWeight: 700,
                color: 'var(--accent-red)', textDecoration: 'none',
                letterSpacing: '0.04em'
              }}>Lupa password?</Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '15px',
                background: loading ? 'var(--border-hover)' : 'var(--accent-red)',
                color: 'white', fontWeight: 800, fontSize: '0.78rem',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(240,46,41,0.35)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(240,46,41,0.45)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(240,46,41,0.35)'
              }}>
              {loading ? 'MEMPROSES...' : <>MASUK <ArrowRight size={15} /></>}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0'
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                letterSpacing: '0.15em', color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}>ATAU</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
            </div>

            {/* Google */}
            <a href="http://localhost:5000/api/auth/google"
              style={{
                width: '100%', padding: '14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                cursor: 'pointer', textDecoration: 'none',
                transition: 'all 0.2s ease',
                fontWeight: 700, fontSize: '0.78rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}>
              <FcGoogle size={18} />
              LANJUTKAN DENGAN GOOGLE
            </a>
          </form>
        </div>
      </div>

      {/* Right Panel — Brand */}
      <div style={{
        width: 480, background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', overflow: 'hidden'
      }}>
        {/* BG decoration */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,46,41,0.08) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(162,18,14,0.06) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 24, animation: 'float 4s ease-in-out infinite' }}>
            🧴
          </div>
          <h2 style={{
            fontSize: '1.6rem', fontWeight: 900,
            letterSpacing: '-0.02em', textTransform: 'uppercase',
            marginBottom: 16
          }}>
            PREMIUM<br />
            <span style={{ color: 'var(--accent-red)' }}>PARFUM DECANT</span>
          </h2>
          <p style={{
            color: 'var(--text-muted)', fontSize: '0.85rem',
            lineHeight: 1.9, maxWidth: 280, margin: '0 auto 40px',
            fontWeight: 400
          }}>
            Temukan signature scent kamu dengan mencoba parfum premium dalam ukuran decant. Anti blind buy.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { value: '50+', label: 'PRODUK' },
              { value: '10+', label: 'BRAND' },
              { value: '100%', label: 'ORIGINAL' }
            ].map(({ value, label }, i) => (
              <div key={label} style={{
                flex: 1, padding: '16px 8px',
                background: 'var(--bg-elevated)',
                borderRadius: i === 0 ? 'var(--radius-sm) 0 0 var(--radius-sm)' :
                  i === 2 ? '0 var(--radius-sm) var(--radius-sm) 0' : 'none',
                border: '1px solid var(--border-default)',
                borderLeft: i === 0 ? '1px solid var(--border-default)' : 'none',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.2rem', fontWeight: 900,
                  color: 'var(--accent-red)', letterSpacing: '-0.02em'
                }}>{value}</div>
                <div style={{
                  fontSize: '0.55rem', fontWeight: 800,
                  letterSpacing: '0.18em', color: 'var(--text-muted)',
                  textTransform: 'uppercase', marginTop: 4
                }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}