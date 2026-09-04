import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 32,
      position: 'relative', overflow: 'hidden'
    }}>
      {/* BG */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(240,46,41,0.06) 0%, transparent 60%)'
      }} />

      {/* Decorative rings */}
      <div style={{
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%', border: '1px solid rgba(240,46,41,0.06)',
        animation: 'rotate-slow 30s linear infinite'
      }} />
      <div style={{
        position: 'absolute', width: 350, height: 350,
        borderRadius: '50%', border: '1px solid rgba(240,46,41,0.04)',
        animation: 'rotate-reverse 20s linear infinite'
      }} />

      <div style={{
        textAlign: 'center', position: 'relative', zIndex: 1,
        animation: 'fadeInUp 0.6s ease'
      }}>
        {/* 404 */}
        <div style={{
          fontSize: 'clamp(6rem, 18vw, 10rem)',
          fontWeight: 900, lineHeight: 1,
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, var(--accent-red), #A2120E, var(--accent-red))',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'redShimmer 3s linear infinite',
          marginBottom: 8
        }}>404</div>

        <div style={{ fontSize: '2.5rem', marginBottom: 24, animation: 'float 4s ease-in-out infinite' }}>
          🧴
        </div>

        <div style={{
          fontSize: '0.62rem', fontWeight: 800,
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: 'var(--accent-red)', marginBottom: 14
        }}>Halaman Tidak Ditemukan</div>

        <h1 style={{
          fontSize: 'clamp(1.4rem, 3vw, 2rem)',
          fontWeight: 900, letterSpacing: '-0.03em',
          textTransform: 'uppercase', marginBottom: 14
        }}>
          PARFUM INI HABIS<br />ATAU TIDAK ADA
        </h1>

        <p style={{
          color: 'var(--text-muted)', fontSize: '0.88rem',
          lineHeight: 1.8, marginBottom: 44, maxWidth: 360,
          margin: '0 auto 44px', fontWeight: 400
        }}>
          Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
          Yuk temukan parfum lain yang cocok untukmu.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', fontWeight: 800,
              fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}>
            <ArrowLeft size={13} /> KEMBALI
          </button>

          <button onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', fontWeight: 800,
              fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}>
            <Home size={13} /> BERANDA
          </button>

          <button onClick={() => navigate('/catalog')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px',
              background: 'var(--accent-red)', color: 'white',
              borderRadius: 'var(--radius-sm)', fontWeight: 800,
              fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(240,46,41,0.35)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(240,46,41,0.45)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(240,46,41,0.35)'
            }}>
            <Search size={13} /> CARI PARFUM
          </button>
        </div>
      </div>
    </div>
  )
}