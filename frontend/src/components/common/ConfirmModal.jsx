export default function ConfirmModal({
  show, onClose, onConfirm,
  title = 'Konfirmasi',
  message = 'Yakin melanjutkan tindakan ini?',
  confirmLabel = 'YA, LANJUTKAN',
  confirmColor = '#ef4444',
  loading = false
}) {
  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 32, maxWidth: 380, width: '100%',
        textAlign: 'center', animation: 'scaleIn 0.2s ease'
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: `${confirmColor}15`,
          border: `1px solid ${confirmColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px', fontSize: '1.4rem', color: confirmColor, fontWeight: 900
        }}>!</div>

        <h3 style={{
          fontWeight: 900, fontSize: '0.95rem',
          textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 10
        }}>{title}</h3>

        <p style={{
          color: 'var(--text-muted)', fontSize: '0.82rem',
          lineHeight: 1.8, marginBottom: 26, fontWeight: 400
        }}>{message}</p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={loading}
            style={{
              flex: 1, padding: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', fontWeight: 800,
              fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer'
            }}>BATAL</button>
          <button onClick={onConfirm} disabled={loading}
            style={{
              flex: 1, padding: '12px',
              background: loading ? 'var(--border-hover)' : confirmColor,
              color: 'white', borderRadius: 'var(--radius-sm)',
              fontWeight: 800, fontSize: '0.7rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}>
            {loading ? 'MEMPROSES...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}