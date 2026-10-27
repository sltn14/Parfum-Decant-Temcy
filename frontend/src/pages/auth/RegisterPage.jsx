import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const AROMA_OPTIONS = [
  { value: 'Floral', label: 'FLORAL', desc: 'Bunga, mawar, melati' },
  { value: 'Woody', label: 'WOODY', desc: 'Kayu, cedar, oud' },
  { value: 'Citrus', label: 'CITRUS', desc: 'Jeruk, lemon, bergamot' },
  { value: 'Spicy', label: 'SPICY', desc: 'Rempah, lada, kayu manis' },
  { value: 'Aquatic', label: 'AQUATIC', desc: 'Laut, air, segar' },
  { value: 'Fresh', label: 'FRESH', desc: 'Mint, teh, hijau' },
  { value: 'Vanilla', label: 'VANILLA', desc: 'Manis, gourmand' },
  { value: 'Musky', label: 'MUSKY', desc: 'Musk, amber, powdery' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    pref_gender: '', pref_aroma: '', pref_longevity: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      toast.success('Registrasi berhasil! Silakan login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal')
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

  const labelStyle = {
    display: 'block', fontSize: '0.65rem', fontWeight: 800,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 8
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary)'
    }}>
      {/* Left — Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 32px', position: 'relative', overflowY: 'auto'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 30% 50%, rgba(240,46,41,0.06) 0%, transparent 60%)'
        }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 40, textDecoration: 'none'
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

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontSize: '2rem', fontWeight: 900,
              letterSpacing: '-0.03em', textTransform: 'uppercase', marginBottom: 8
            }}>
              {step === 1 ? 'DAFTAR' : 'PREFERENSI'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>
              {step === 1 ? (
                <>Sudah punya akun?{' '}
                  <Link to="/login" style={{ color: 'var(--accent-red)', fontWeight: 700 }}>Masuk</Link>
                </>
              ) : 'Ceritakan selera wangi kamu'}
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                height: 3, flex: s === 1 ? 1 : 1,
                background: s <= step ? 'var(--accent-red)' : 'var(--border-default)',
                borderRadius: 2, transition: '400ms ease'
              }} />
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Nama Lengkap</label>
                <input type="text" name="full_name" value={form.full_name}
                  onChange={handleChange} placeholder="Nama lengkap kamu"
                  required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="email@example.com"
                  required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  No. HP <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(opsional)</span>
                </label>
                <input type="tel" name="phone" value={form.phone}
                  onChange={handleChange} placeholder="08xxxxxxxxxx"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password" value={form.password}
                    onChange={handleChange} placeholder="Minimal 8 karakter"
                    required style={{ ...inputStyle, paddingRight: 48 }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 14, top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer'
                    }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button onClick={() => {
                if (!form.full_name || !form.email || !form.password) {
                  toast.error('Isi semua field yang wajib')
                  return
                }
                if (form.password.length < 8) {
                  toast.error('Password minimal 8 karakter')
                  return
                }
                setStep(2)
              }}
                style={{
                  width: '100%', padding: '15px',
                  background: 'var(--accent-red)', color: 'white',
                  fontWeight: 800, fontSize: '0.78rem',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 20px rgba(240,46,41,0.35)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(240,46,41,0.45)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(240,46,41,0.35)'
                }}>
                LANJUT <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              {/* Gender */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Preferensi Gender Wangi</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Male', 'Female', 'Unisex'].map(g => (
                    <button key={g} type="button"
                      onClick={() => setForm({ ...form, pref_gender: g })}
                      style={{
                        flex: 1, padding: '12px 8px',
                        background: form.pref_gender === g ? 'var(--accent-red)' : 'var(--bg-elevated)',
                        border: `1px solid ${form.pref_gender === g ? 'var(--accent-red)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: form.pref_gender === g ? 'white' : 'var(--text-secondary)',
                        fontWeight: 800, cursor: 'pointer',
                        fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        transition: 'all 0.2s ease'
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aroma */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Aroma Favorit</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {AROMA_OPTIONS.map(({ value, label, desc }) => (
                    <button key={value} type="button"
                      onClick={() => setForm({ ...form, pref_aroma: value })}
                      style={{
                        padding: '12px 14px',
                        background: form.pref_aroma === value ? 'rgba(240,46,41,0.1)' : 'var(--bg-elevated)',
                        border: `1px solid ${form.pref_aroma === value ? 'var(--accent-red)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.2s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                      <div>
                        <div style={{
                          fontSize: '0.65rem', fontWeight: 800,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: form.pref_aroma === value ? 'var(--accent-red)' : 'var(--text-secondary)',
                          marginBottom: 2
                        }}>{label}</div>
                        <div style={{
                          fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400
                        }}>{desc}</div>
                      </div>
                      {form.pref_aroma === value && (
                        <Check size={14} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ketahanan */}
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>Preferensi Ketahanan</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'pendek', label: '< 4 JAM' },
                    { value: 'sedang', label: '4-8 JAM' },
                    { value: 'lama', label: '> 8 JAM' }
                  ].map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => setForm({ ...form, pref_longevity: value })}
                      style={{
                        flex: 1, padding: '12px 8px',
                        background: form.pref_longevity === value ? 'var(--accent-red)' : 'var(--bg-elevated)',
                        border: `1px solid ${form.pref_longevity === value ? 'var(--accent-red)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: form.pref_longevity === value ? 'white' : 'var(--text-secondary)',
                        fontWeight: 800, cursor: 'pointer',
                        fontSize: '0.65rem', letterSpacing: '0.1em',
                        transition: 'all 0.2s ease'
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '15px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)', fontWeight: 800,
                    fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s ease'
                  }}>
                  <ArrowLeft size={14} /> KEMBALI
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  style={{
                    flex: 2, padding: '15px',
                    background: loading ? 'var(--border-hover)' : 'var(--accent-red)',
                    color: 'white', fontWeight: 800, fontSize: '0.78rem',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    borderRadius: 'var(--radius-sm)', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(240,46,41,0.35)',
                    transition: 'all 0.3s ease'
                  }}>
                  {loading ? 'MEMPROSES...' : <>DAFTAR SEKARANG <ArrowRight size={14} /></>}
                </button>
              </div>

              <p style={{
                textAlign: 'center', marginTop: 16,
                fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400
              }}>
                Preferensi bisa diubah kapan saja di profil kamu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        width: 480, background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,46,41,0.08) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite'
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 24, animation: 'float 4s ease-in-out infinite' }}>
            {step === 1 ? '🧴' : '✨'}
          </div>
          <h2 style={{
            fontSize: '1.5rem', fontWeight: 900,
            letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: 16
          }}>
            {step === 1 ? (
              <>BERGABUNG<br /><span style={{ color: 'var(--accent-red)' }}>BERSAMA KAMI</span></>
            ) : (
              <>REKOMENDASI<br /><span style={{ color: 'var(--accent-red)' }}>PERSONAL</span></>
            )}
          </h2>
          <p style={{
            color: 'var(--text-muted)', fontSize: '0.85rem',
            lineHeight: 1.9, maxWidth: 280, margin: '0 auto',
            fontWeight: 400
          }}>
            {step === 1
              ? 'Daftar sekarang dan temukan parfum yang tepat untukmu dengan bantuan AI.'
              : 'Data preferensimu akan digunakan untuk memberikan rekomendasi parfum yang personal dan relevan.'}
          </p>
        </div>
      </div>
    </div>
  )
}