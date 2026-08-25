import { useState, useEffect } from 'react'
import { User, Lock, Save, Eye, EyeOff, Check } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const AROMA_OPTIONS = [
  { value: 'Floral', label: 'FLORAL' },
  { value: 'Woody', label: 'WOODY' },
  { value: 'Citrus', label: 'CITRUS' },
  { value: 'Spicy', label: 'SPICY' },
  { value: 'Aquatic', label: 'AQUATIC' },
  { value: 'Fresh', label: 'FRESH' },
  { value: 'Vanilla', label: 'VANILLA' },
  { value: 'Musky', label: 'MUSKY' },
]

const TABS = [
  { key: 'profile', icon: <User size={15} />, label: 'PROFIL' },
  { key: 'password', icon: <Lock size={15} />, label: 'PASSWORD' },
  { key: 'preference', icon: '✨', label: 'PREFERENSI' }
]

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '', phone: '',
    pref_gender: '', pref_aroma: '', pref_longevity: ''
  })
  const [passwords, setPasswords] = useState({
    old_password: '', new_password: '', confirm_password: ''
  })
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false })

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        phone: user.phone || '',
        pref_gender: user.pref_gender || '',
        pref_aroma: user.pref_aroma || '',
        pref_longevity: user.pref_longevity || ''
      })
    }
  }, [user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.put('/users/profile', profile)
      updateUser(res.data.user)
      toast.success('Profil berhasil diupdate!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal update profil')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('Password tidak cocok')
      return
    }
    setLoading(true)
    try {
      await api.put('/users/change-password', {
        old_password: passwords.old_password,
        new_password: passwords.new_password
      })
      toast.success('Password berhasil diubah!')
      setPasswords({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal ubah password')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.88rem',
    outline: 'none', fontFamily: 'var(--font-sans)',
    fontWeight: 500, transition: 'border-color 0.2s ease'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.62rem', fontWeight: 800,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 8
  }

  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 28px',
    background: loading ? 'var(--border-hover)' : 'var(--accent-red)',
    color: 'white', fontWeight: 800, fontSize: '0.72rem',
    letterSpacing: '0.15em', textTransform: 'uppercase',
    borderRadius: 'var(--radius-sm)', border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: loading ? 'none' : '0 4px 16px rgba(240,46,41,0.3)',
    transition: 'all 0.3s ease'
  }

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 10
          }}>Akun</div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase'
          }}>PROFIL SAYA</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28 }}>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Avatar Card */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24,
              textAlign: 'center'
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-red), #A2120E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 900, color: 'white',
                margin: '0 auto 16px',
                letterSpacing: '-0.02em'
              }}>
                {getInitials(user?.full_name)}
              </div>
              <div style={{
                fontWeight: 800, fontSize: '0.95rem',
                letterSpacing: '-0.01em', marginBottom: 4
              }}>{user?.full_name}</div>
              <div style={{
                fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400
              }}>{user?.email}</div>
              <div style={{
                marginTop: 12, display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(240,46,41,0.08)',
                border: '1px solid rgba(240,46,41,0.15)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.58rem', fontWeight: 800,
                letterSpacing: '0.15em', color: 'var(--accent-red)'
              }}>
                {user?.role === 'admin' ? '👑 ADMIN' : 'CUSTOMER'}
              </div>
            </div>

            {/* Nav */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden'
            }}>
              {TABS.map(({ key, icon, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{
                    width: '100%', padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: activeTab === key ? 'rgba(240,46,41,0.08)' : 'transparent',
                    borderLeft: `3px solid ${activeTab === key ? 'var(--accent-red)' : 'transparent'}`,
                    color: activeTab === key ? 'var(--accent-red)' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.65rem',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    border: 'none', borderLeft: `3px solid ${activeTab === key ? 'var(--accent-red)' : 'transparent'}`
                  }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: 36
          }}>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 28,
                  paddingBottom: 16, borderBottom: '1px solid var(--border-default)'
                }}>EDIT PROFIL</div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Nama Lengkap</label>
                  <input type="text" value={profile.full_name}
                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={user?.email} disabled
                    style={{ ...inputStyle, opacity: 0.4, cursor: 'not-allowed' }} />
                  <p style={{
                    fontSize: '0.7rem', color: 'var(--text-muted)',
                    marginTop: 6, fontWeight: 400
                  }}>Email tidak dapat diubah</p>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={labelStyle}>No. HP</label>
                  <input type="tel" value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>

                <button type="submit" disabled={loading} style={btnStyle}>
                  <Save size={14} />
                  {loading ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 28,
                  paddingBottom: 16, borderBottom: '1px solid var(--border-default)'
                }}>UBAH PASSWORD</div>

                {[
                  { key: 'old', name: 'old_password', label: 'Password Lama' },
                  { key: 'new', name: 'new_password', label: 'Password Baru' },
                  { key: 'confirm', name: 'confirm_password', label: 'Konfirmasi Password Baru' }
                ].map(({ key, name, label }) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPass[key] ? 'text' : 'password'}
                        value={passwords[name]}
                        onChange={e => setPasswords({ ...passwords, [name]: e.target.value })}
                        placeholder="••••••••"
                        style={{ ...inputStyle, paddingRight: 48 }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                      />
                      <button type="button"
                        onClick={() => setShowPass({ ...showPass, [key]: !showPass[key] })}
                        style={{
                          position: 'absolute', right: 14, top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer'
                        }}>
                        {showPass[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}

                <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: 12 }}>
                  <Lock size={14} />
                  {loading ? 'MENYIMPAN...' : 'UBAH PASSWORD'}
                </button>
              </form>
            )}

            {/* Preference Tab */}
            {activeTab === 'preference' && (
              <form onSubmit={handleUpdateProfile}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 28,
                  paddingBottom: 16, borderBottom: '1px solid var(--border-default)'
                }}>PREFERENSI WANGI</div>

                {/* Gender */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Preferensi Gender</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Male', 'Female', 'Unisex'].map(g => (
                      <button key={g} type="button"
                        onClick={() => setProfile({ ...profile, pref_gender: g })}
                        style={{
                          flex: 1, padding: '12px',
                          background: profile.pref_gender === g ? 'var(--accent-red)' : 'var(--bg-elevated)',
                          border: `1px solid ${profile.pref_gender === g ? 'var(--accent-red)' : 'var(--border-default)'}`,
                          borderRadius: 'var(--radius-sm)',
                          color: profile.pref_gender === g ? 'white' : 'var(--text-secondary)',
                          fontWeight: 800, cursor: 'pointer',
                          fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {AROMA_OPTIONS.map(({ value, label }) => (
                      <button key={value} type="button"
                        onClick={() => setProfile({ ...profile, pref_aroma: value })}
                        style={{
                          padding: '10px 8px',
                          background: profile.pref_aroma === value ? 'rgba(240,46,41,0.1)' : 'var(--bg-elevated)',
                          border: `1px solid ${profile.pref_aroma === value ? 'var(--accent-red)' : 'var(--border-default)'}`,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: 4
                        }}>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 800,
                          letterSpacing: '0.1em',
                          color: profile.pref_aroma === value ? 'var(--accent-red)' : 'var(--text-secondary)'
                        }}>{label}</span>
                        {profile.pref_aroma === value && (
                          <Check size={11} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
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
                        onClick={() => setProfile({ ...profile, pref_longevity: value })}
                        style={{
                          flex: 1, padding: '12px',
                          background: profile.pref_longevity === value ? 'var(--accent-red)' : 'var(--bg-elevated)',
                          border: `1px solid ${profile.pref_longevity === value ? 'var(--accent-red)' : 'var(--border-default)'}`,
                          borderRadius: 'var(--radius-sm)',
                          color: profile.pref_longevity === value ? 'white' : 'var(--text-secondary)',
                          fontWeight: 800, cursor: 'pointer',
                          fontSize: '0.65rem', letterSpacing: '0.12em',
                          transition: 'all 0.2s ease'
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading} style={btnStyle}>
                  <Save size={14} />
                  {loading ? 'MENYIMPAN...' : 'SIMPAN PREFERENSI'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}