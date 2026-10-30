import { useState, useEffect } from 'react'
import { Settings, Mail, Globe, Bot, Save, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function SysAdminConfig() {
  const [configs, setConfigs] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingSmtp, setTestingSmtp] = useState(false)
  const [testingAi, setTestingAi] = useState(false)
  const [smtpResult, setSmtpResult] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [showPass, setShowPass] = useState({})
  const [form, setForm] = useState({})

  useEffect(() => { fetchConfigs() }, [])

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/sysadmin/config')
      setConfigs(res.data.configs)
      setForm(res.data.configs)
    } catch { toast.error('Gagal memuat konfigurasi') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/sysadmin/config', { configs: form })
      toast.success('Konfigurasi berhasil disimpan!')
      fetchConfigs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleTestSmtp = async () => {
    setTestingSmtp(true)
    setSmtpResult(null)
    try {
      const res = await api.post('/sysadmin/config/test-smtp')
      setSmtpResult({ ok: true, message: res.data.message })
      toast.success(res.data.message)
    } catch (err) {
      setSmtpResult({ ok: false, message: err.response?.data?.message || 'Koneksi SMTP gagal' })
      toast.error(err.response?.data?.message || 'Koneksi SMTP gagal')
    } finally { setTestingSmtp(false) }
  }

  const handleTestAi = async () => {
    setTestingAi(true)
    setAiResult(null)
    try {
      const res = await api.post('/sysadmin/config/test-ai')
      setAiResult({ ok: true, message: res.data.message })
      toast.success(res.data.message)
    } catch (err) {
      setAiResult({ ok: false, message: err.response?.data?.message || 'AI Service tidak tersedia' })
      toast.error(err.response?.data?.message || 'AI Service tidak tersedia')
    } finally { setTestingAi(false) }
  }

  const toggleShowPass = (key) => {
    setShowPass(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
    outline: 'none', fontFamily: 'var(--font-sans)',
    fontWeight: 500, transition: 'border-color 0.2s ease'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.6rem', fontWeight: 800,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 6
  }

  const sectionStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)', padding: 28,
    marginBottom: 20
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: '#8b5cf6', animation: 'rotate-slow 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div>
      <style>{`
        .syscfg-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
        .syscfg-h1 { font-weight: 900; font-size: 1.8rem; letter-spacing: -0.02em; text-transform: uppercase; margin: 0; }
        .syscfg-save-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 22px; color: white; font-weight: 800;
          font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase;
          border-radius: var(--radius-sm); border: none;
        }
        .syscfg-smtp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 768px) {
          .syscfg-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; margin-bottom: 20px !important; }
          .syscfg-h1 { font-size: 1.3rem !important; }
          .syscfg-save-btn { width: 100% !important; justify-content: center !important; }
          .syscfg-smtp-grid { grid-template-columns: 1fr !important; }
          .syscfg-section-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .syscfg-section-header > div:last-child { width: 100% !important; justify-content: flex-start !important; }
          .syscfg-section { padding: 18px !important; }
        }
      `}</style>

      {/* Header */}
      <div className="syscfg-header">
        <div>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#8b5cf6', marginBottom: 8
          }}>Administrator Sistem</div>
          <h1 className="syscfg-h1">KONFIGURASI SISTEM</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="syscfg-save-btn"
          style={{
            background: saving ? 'var(--border-hover)' : '#8b5cf6',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: saving ? 'none' : '0 4px 14px rgba(139,92,246,0.3)'
          }}>
          <Save size={14} />
          {saving ? 'MENYIMPAN...' : 'SIMPAN SEMUA'}
        </button>
      </div>

      {/* SMTP Config */}
      <div style={sectionStyle}>
        <div className="syscfg-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Email Service (SMTP)</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>Konfigurasi layanan email untuk notifikasi</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {smtpResult && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: smtpResult.ok ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                {smtpResult.ok ? <Wifi size={13} /> : <WifiOff size={13} />}
                {smtpResult.ok ? 'ONLINE' : 'OFFLINE'}
              </span>
            )}
            <button onClick={handleTestSmtp} disabled={testingSmtp}
              style={{
                padding: '7px 16px',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 'var(--radius-sm)', color: '#f59e0b',
                fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: testingSmtp ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease'
              }}>
              {testingSmtp ? 'TESTING...' : 'TEST KONEKSI'}
            </button>
          </div>
        </div>

        <div className="syscfg-smtp-grid">
          <div>
            <label style={labelStyle}>SMTP Host</label>
            <input type="text" value={form.SMTP_HOST || ''}
              onChange={e => setForm(prev => ({ ...prev, SMTP_HOST: e.target.value }))}
              placeholder="smtp.gmail.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
          </div>
          <div>
            <label style={labelStyle}>SMTP Port</label>
            <input type="text" value={form.SMTP_PORT || ''}
              onChange={e => setForm(prev => ({ ...prev, SMTP_PORT: e.target.value }))}
              placeholder="587" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
          </div>
          <div>
            <label style={labelStyle}>Email Pengirim</label>
            <input type="email" value={form.SMTP_USER || ''}
              onChange={e => setForm(prev => ({ ...prev, SMTP_USER: e.target.value }))}
              placeholder="email@domain.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
          </div>
          <div>
            <label style={labelStyle}>App Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass.SMTP_PASS ? 'text' : 'password'} value={form.SMTP_PASS || ''}
                onChange={e => setForm(prev => ({ ...prev, SMTP_PASS: e.target.value }))}
                placeholder="App password Gmail" style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
              <button type="button" onClick={() => toggleShowPass('SMTP_PASS')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                {showPass.SMTP_PASS ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Google OAuth Config */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Google OAuth</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>Konfigurasi autentikasi Google</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Google Client ID</label>
            <input type="text" value={form.GOOGLE_CLIENT_ID || ''}
              onChange={e => setForm(prev => ({ ...prev, GOOGLE_CLIENT_ID: e.target.value }))}
              placeholder="xxxx.apps.googleusercontent.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
          </div>
          <div>
            <label style={labelStyle}>Google Client Secret</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass.GOOGLE_CLIENT_SECRET ? 'text' : 'password'} value={form.GOOGLE_CLIENT_SECRET || ''}
                onChange={e => setForm(prev => ({ ...prev, GOOGLE_CLIENT_SECRET: e.target.value }))}
                placeholder="GOCSPX-xxxxxxxxxxxx" style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
              <button type="button" onClick={() => toggleShowPass('GOOGLE_CLIENT_SECRET')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                {showPass.GOOGLE_CLIENT_SECRET ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Service Config */}
      <div style={sectionStyle}>
        <div className="syscfg-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>AI Service (Gemini)</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>API key Google Gemini untuk chatbot rekomendasi</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {aiResult && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: aiResult.ok ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                {aiResult.ok ? <Wifi size={13} /> : <WifiOff size={13} />}
                {aiResult.ok ? 'ONLINE' : 'OFFLINE'}
              </span>
            )}
            <button onClick={handleTestAi} disabled={testingAi}
              style={{
                padding: '7px 16px',
                background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: 'var(--radius-sm)', color: '#8b5cf6',
                fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: testingAi ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease'
              }}>
              {testingAi ? 'TESTING...' : 'TEST KONEKSI'}
            </button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Gemini API Key</label>
          <div style={{ position: 'relative' }}>
            <input type={showPass.GEMINI_API_KEY ? 'text' : 'password'} value={form.GEMINI_API_KEY || ''}
              onChange={e => setForm(prev => ({ ...prev, GEMINI_API_KEY: e.target.value }))}
              placeholder="Tempel API key dari Google AI Studio" style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
            <button type="button" onClick={() => toggleShowPass('GEMINI_API_KEY')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
              {showPass.GEMINI_API_KEY ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: '12px 14px',
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.15)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400
        }}>
          💡 Chatbot Mincy AI memakai model <strong>gemini-2.5-flash</strong>. Tidak perlu URL endpoint, cukup API key. Kalau kolom ini dikosongkan, sistem pakai <code>GEMINI_API_KEY</code> dari file .env server. Setelah simpan, klik TEST KONEKSI.
        </div>
      </div>
    </div>
  )
}