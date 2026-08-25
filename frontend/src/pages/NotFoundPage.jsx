import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 24,
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: 480 }}>

        {/* 404 Text */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          fontWeight: 700, lineHeight: 1,
          background: 'linear-gradient(135deg, var(--accent-red), #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 16
        }}>
          404
        </div>

        <div style={{ fontSize: '2rem', marginBottom: 16 }}>🧴</div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem', fontWeight: 700, marginBottom: 12
        }}>
          Halaman Tidak Ditemukan
        </h1>

        <p style={{
          color: 'var(--text-muted)', fontSize: '0.95rem',
          lineHeight: 1.8, marginBottom: 40
        }}>
          Sepertinya parfum yang kamu cari sudah habis atau halaman ini tidak ada.
          Yuk kita cari parfum lain yang cocok untukmu!
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.9rem'
            }}>
            <ArrowLeft size={16} /> Kembali
          </button>

          <button onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.9rem'
            }}>
            <Home size={16} /> Beranda
          </button>

          <button onClick={() => navigate('/catalog')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'var(--accent-red)', color: 'white',
              borderRadius: 'var(--radius-md)', fontWeight: 600,
              border: 'none', cursor: 'pointer', fontSize: '0.9rem'
            }}>
            <Search size={16} /> Cari Parfum
          </button>
        </div>

      </div>
    </div>
  )
}