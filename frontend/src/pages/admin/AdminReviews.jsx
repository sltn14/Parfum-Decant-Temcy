import { useState, useEffect } from 'react'
import { Star, Trash2, Search } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchReviews()
  }, [page])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/reviews?page=${page}&limit=10`)
      setReviews(res.data.reviews)
      setTotal(res.data.total)
      setTotalPages(Math.ceil(res.data.total / 10))
    } catch {
      toast.error('Gagal memuat reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus review ini?')) return
    try {
      await api.delete(`/reviews/admin/${id}`)
      toast.success('Review berhasil dihapus!')
      fetchReviews()
    } catch {
      toast.error('Gagal menghapus review')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)'
        }}>
          Manajemen Review
        </h1>
        <div style={{
          padding: '6px 14px',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600
        }}>
          Total: {total} review
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {['Produk', 'User', 'Rating', 'Komentar', 'Tanggal', 'Aksi'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '0.78rem', fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Memuat...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Belum ada review
                </td>
              </tr>
            ) : (
              reviews.map((review, i) => (
                <tr key={review.review_id} style={{
                  borderTop: '1px solid var(--border-default)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {review.product?.product_name || '-'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)' }}>
                      {review.product?.brand}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {review.user?.full_name || '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14}
                          style={{
                            color: s <= review.rating ? '#f59e0b' : 'var(--border-hover)',
                            fill: s <= review.rating ? '#f59e0b' : 'transparent'
                          }} />
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 300 }}>
                    <div style={{
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {review.comment || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {new Date(review.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDelete(review.review_id)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: '0.8rem'
                      }}>
                      <Trash2 size={13} /> Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: '8px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}>← Prev</button>
          <span style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{
              padding: '8px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}>Next →</button>
        </div>
      )}
    </div>
  )
}