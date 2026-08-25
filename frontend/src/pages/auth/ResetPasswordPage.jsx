import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [form, setForm] = useState({ new_password: '', confirm_password: '' })
  const [showPass, setShowPass] = useState({ new: false, confirm: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) {
      toast.error('Password tidak cocok')
      return
    }
    if (form.new_password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: form.new_password })
      toast.success('Password berhasil direset!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal reset password')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = {
    display: 'block', fontSize: '0.65rem', fontWeight: 800,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 8
  }

  if (!token) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
        <h2 style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
          TOKEN TIDAK VALID
        </h2>
        <Link to="/login" style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '0.85rem' }}>
          Kembali ke Login
        </Link>
      </div>
    </div>
  )

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

        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            fontSize: '2rem', fontWeight: 900,
            letterSpacing: '-0.03em', textTransform: 'uppercase', marginBottom: 8
          }}>RESET PASSWORD</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>
            Buat password baru untuk akunmu
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { key: 'new', name: 'new_password', label: 'Password Baru' },
            { key: 'confirm', name: 'confirm_password', label: 'Konfirmasi Password' }
          ].map(({ key, name, label }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass[key] ? 'text' : 'password'}
                  value={form[name]}
                  onChange={e => setForm({ ...form, [name]: e.target.value })}
                  placeholder="••••••••" required
                  style={{
                    width: '100%', padding: '14px 48px 14px 16px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)', fontSize: '0.88rem',
                    outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500,
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
                <button type="button"
                  onClick={() => setShowPass({ ...showPass, [key]: !showPass[key] })}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer'
                  }}>
                  {showPass[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '15px', marginTop: 12,
              background: loading ? 'var(--border-hover)' : 'var(--accent-red)',
              color: 'white', fontWeight: 800, fontSize: '0.78rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              borderRadius: 'var(--radius-sm)', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(240,46,41,0.35)',
              transition: 'all 0.3s ease'
            }}>
            {loading ? 'MENYIMPAN...' : <>RESET PASSWORD <ArrowRight size={15} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}