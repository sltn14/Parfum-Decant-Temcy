import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 24, position: 'relative'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(240,46,41,0.06) 0%, transparent 60%)'
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 48, textDecoration: 'none'
        }}>
          <div style={{ width: 32, height: 32, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="DT"
              style={{ width: 100, height: 100, filter: 'brightness(0) invert(1)', transform: 'scale(2.2)', objectFit: 'contain' }}
            />
          </div>
          <span style={{ fontWeight: 900, fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--text-primary)' }}>DECANT </span>
            <span style={{ color: 'var(--accent-red)' }}>TEMCY</span>
          </span>
        </Link>

        {!sent ? (
          <>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{
                fontSize: '2rem', fontWeight: 900,
                letterSpacing: '-0.03em', textTransform: 'uppercase', marginBottom: 8
              }}>LUPA PASSWORD</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400, lineHeight: 1.7 }}>
                Masukkan email yang terdaftar. Kami akan kirimkan link untuk reset password.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 8
                }}>Email</label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)', fontSize: '0.88rem',
                    outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '15px',
                  background: loading ? 'var(--border-hover)' : 'var(--accent-red)',
                  color: 'white', fontWeight: 800, fontSize: '0.78rem',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(240,46,41,0.35)',
                  transition: 'all 0.3s ease', marginBottom: 20
                }}>
                {loading ? 'MENGIRIM...' : <>KIRIM LINK RESET <ArrowRight size={15} /></>}
              </button>

              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: '0.75rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--text-muted)', textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <ArrowLeft size={14} /> KEMBALI KE LOGIN
              </Link>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(240,46,41,0.1)',
              border: '1px solid rgba(240,46,41,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: '1.8rem'
            }}>📧</div>
            <h2 style={{
              fontSize: '1.5rem', fontWeight: 900,
              letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: 12
            }}>CEK EMAIL KAMU</h2>
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.85rem',
              lineHeight: 1.9, marginBottom: 32, fontWeight: 400
            }}>
              Link reset password sudah dikirim ke<br />
              <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: '0.75rem', fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--accent-red)', textDecoration: 'none'
            }}>
              <ArrowLeft size={14} /> KEMBALI KE LOGIN
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}