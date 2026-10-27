import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null) // review_id
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchReviews() }, [page])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/reviews?page=${page}&limit=10`)
      setReviews(res.data.reviews)
      setTotal(res.data.total)
      setTotalPages(Math.ceil(res.data.total / 10))
    } catch { toast.error('Gagal memuat reviews') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/reviews/admin/${deleteTarget}`)
      toast.success('Review dihapus!')
      setDeleteTarget(null)
      fetchReviews()
    } catch { toast.error('Gagal menghapus') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .reviews-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .reviews-table-wrap {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .reviews-table-wrap table {
            min-width: 600px;
          }
        }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: '0.62rem', fontWeight: 800,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--accent-red)', marginBottom: 8
        }}>Kelola</div>
        <div className="reviews-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{
            fontWeight: 900, fontSize: '1.8rem',
            letterSpacing: '-0.02em', textTransform: 'uppercase',
            color: 'var(--text-primary)'
          }}>MANAJEMEN REVIEW</h1>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{total}</span> review
          </div>
        </div>
      </div>

      <div className="reviews-table-wrap" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {['Produk', 'User', 'Rating', 'Komentar', 'Tanggal', 'Aksi'].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: '0.58rem', fontWeight: 800,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.12em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>MEMUAT...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>BELUM ADA REVIEW</td></tr>
            ) : reviews.map(review => (
              <tr key={review.review_id} style={{
                borderTop: '1px solid var(--border-default)',
                transition: 'background 0.15s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>
                    {review.product?.product_name || '-'}
                  </div>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 800,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--accent-red)'
                  }}>{review.product?.brand}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {review.user?.full_name || '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: '0.82rem', opacity: s <= review.rating ? 1 : 0.15 }}>⭐</span>
                    ))}
                  </div>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 800, marginTop: 2,
                    color: review.rating >= 4 ? '#22c55e' : review.rating >= 3 ? '#f59e0b' : '#ef4444'
                  }}>{review.rating}/5</div>
                </td>
                <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                  <div style={{
                    fontSize: '0.78rem', color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontWeight: 400
                  }}>
                    {review.comment || '-'}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {new Date(review.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => setDeleteTarget(review.review_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 'var(--radius-xs)',
                      color: '#ef4444', cursor: 'pointer',
                      fontSize: '0.62rem', fontWeight: 800,
                      letterSpacing: '0.08em', transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ef4444'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                      e.currentTarget.style.color = '#ef4444'
                    }}>
                    <Trash2 size={11} /> HAPUS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: '8px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
              color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.75rem'
            }}>← PREV</button>
          <span style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{
              padding: '8px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
              color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.75rem'
            }}>NEXT →</button>
        </div>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="HAPUS REVIEW?"
        message="Review ini akan dihapus secara permanen dan tidak bisa dikembalikan."
        confirmLabel="YA, HAPUS"
      />
    </div>
  )
}