import { useState, useEffect } from 'react'
import { Search, X, Package } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

const API_URL = 'http://localhost:5000'
const STOCK_MIN_TOTAL = 10

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const SIZES = [1, 2, 3, 5]

const getTotalStock = (product) =>
  (product.stock_1ml || 0) + (product.stock_2ml || 0) + (product.stock_3ml || 0) + (product.stock_5ml || 0)

// Status config — dot + label only, no icon clutter
const getStokStatus = (product) => {
  const total = getTotalStock(product)
  if (total <= 0) return { label: 'Habis', color: '#ef4444', dot: '#ef4444', bg: 'rgba(239,68,68,0.07)', tier: 0 }
  if (total <= STOCK_MIN_TOTAL) return { label: 'Menipis', color: '#f59e0b', dot: '#f59e0b', bg: 'rgba(245,158,11,0.07)', tier: 1 }
  return { label: 'Aman', color: '#22c55e', dot: '#22c55e', bg: 'rgba(34,197,94,0.07)', tier: 2 }
}

export default function AdminInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [editStok, setEditStok] = useState({})
  const [saving, setSaving] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [filter, setFilter] = useState('semua')
  const [summary, setSummary] = useState({ habis: 0, menipis: 0, aman: 0 })

  useEffect(() => { fetchProducts() }, [page, search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (search) params.set('search', search)
      const res = await api.get(`/products/admin/all?${params}`)
      setProducts(res.data.products || [])
      setTotal(res.data.total || 0)
      setTotalPages(res.data.totalPages || 1)
      setSummary(res.data.summary || { habis: 0, menipis: 0, aman: 0 })
    } catch {
      toast.error('Gagal memuat inventaris')
    } finally {
      setLoading(false)
    }
  }

  const handleStokChange = (productId, size, value) => {
    setEditStok(prev => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [size]: value }
    }))
  }

  const hasChange = (productId) => {
    const edit = editStok[productId]
    if (!edit) return false
    return SIZES.some(s => edit[s] !== undefined && edit[s] !== '')
  }

  const handleUpdateStok = (product) => {
    const edit = editStok[product.product_id] || {}
    const hasAny = SIZES.some(s => edit[s] !== undefined && edit[s] !== '')
    if (!hasAny) { toast.error('Masukkan stok minimal satu ukuran'); return }
    for (const s of SIZES) {
      if (edit[s] !== undefined && edit[s] !== '') {
        if (isNaN(edit[s]) || parseInt(edit[s]) < 0) { toast.error(`Stok ${s}ml tidak valid`); return }
      }
    }
    setConfirmTarget({
      product_id: product.product_id,
      name: `${product.brand} ${product.product_name}`,
      edit
    })
  }

  const doUpdateStok = async () => {
    if (!confirmTarget) return
    setSaving(confirmTarget.product_id)
    try {
      const payload = {}
      SIZES.forEach(s => {
        const val = confirmTarget.edit[s]
        if (val !== undefined && val !== '') payload[`stock_${s}ml`] = parseInt(val)
      })
      await api.patch(`/products/${confirmTarget.product_id}/stock`, payload)
      toast.success('Stok berhasil diperbarui!')
      const id = confirmTarget.product_id
      setConfirmTarget(null)
      setEditStok(prev => { const next = { ...prev }; delete next[id]; return next })
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal update stok')
    } finally {
      setSaving(null)
    }
  }

  const filteredProducts = products.filter(p => {
    const t = getTotalStock(p)
    if (filter === 'menipis') return t <= STOCK_MIN_TOTAL
    if (filter === 'aman') return t > STOCK_MIN_TOTAL
    return true
  })

  const buildConfirmMsg = () => {
    if (!confirmTarget) return ''
    const lines = SIZES
      .filter(s => confirmTarget.edit[s] !== undefined && confirmTarget.edit[s] !== '')
      .map(s => `${s}ml → ${confirmTarget.edit[s]} pcs`)
      .join(', ')
    return `Stok "${confirmTarget.name}" akan diperbarui: ${lines}`
  }

  const summaryCards = [
    { label: 'Stok Habis', value: summary.habis, color: '#ef4444', f: 'menipis',
      desc: 'produk kosong' },
    { label: 'Stok Menipis', value: summary.menipis, color: '#f59e0b', f: 'menipis',
      desc: `≤ ${STOCK_MIN_TOTAL} pcs total` },
    { label: 'Stok Aman', value: summary.aman, color: '#22c55e', f: 'aman',
      desc: 'siap jual' },
  ]

  return (
    <div>
      <style>{`
        .inv-header { margin-bottom: 32px; }
        .inv-label-tag {
          font-size: 0.62rem; font-weight: 800;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--accent-red); margin-bottom: 8px;
        }
        .inv-h1 {
          font-weight: 900; font-size: 1.8rem;
          letter-spacing: -0.02em; text-transform: uppercase;
          color: var(--text-primary); margin: 0;
        }
        .inv-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .inv-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .inv-table-wrap {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .inv-header { margin-bottom: 20px !important; }
          .inv-h1 { font-size: 1.3rem !important; }
          .inv-summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
          }
          .inv-summary-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; }
          .inv-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .inv-toolbar > div {
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="inv-header">
        <div className="inv-label-tag">Kelola</div>
        <h1 className="inv-h1">MANAJEMEN INVENTARIS</h1>
      </div>

      {/* Summary Cards */}
      <div className="inv-summary-grid">
        {summaryCards.map(({ label, value, color, f, desc }) => {
          const active = filter === f
          return (
            <div key={label}
              onClick={() => setFilter(prev => prev === f ? 'semua' : f)}
              style={{
                background: active ? color + '0d' : 'var(--bg-card)',
                border: `1.5px solid ${active ? color + '40' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = color + '30' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-default)' }}
            >
              {/* dot + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: color, display: 'inline-block', flexShrink: 0
                }} />
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  color: 'var(--text-muted)', letterSpacing: '0.04em'
                }}>{label}</span>
              </div>
              <div style={{
                fontSize: '2.4rem', fontWeight: 900,
                color: active ? color : 'var(--text-primary)',
                letterSpacing: '-0.04em', lineHeight: 1,
                transition: 'color 0.18s ease'
              }}>{value}</div>
              <div style={{
                fontSize: '0.72rem', color: 'var(--text-muted)',
                fontWeight: 500, marginTop: 6
              }}>{desc}</div>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="inv-toolbar">
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px', flex: 1, maxWidth: 360,
          transition: 'border-color 0.2s'
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(240,46,41,0.4)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
        >
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text" placeholder="Cari produk..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.85rem',
              fontFamily: 'var(--font-sans)', fontWeight: 500
            }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }}
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'semua', label: 'Semua' },
            { key: 'menipis', label: 'Perlu Restock' },
            { key: 'aman', label: 'Aman' }
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                padding: '8px 16px',
                background: filter === key ? 'var(--accent-red)' : 'var(--bg-card)',
                border: `1px solid ${filter === key ? 'transparent' : 'var(--border-default)'}`,
                borderRadius: 100,
                color: filter === key ? 'white' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.78rem',
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{total}</span> produk
        </div>
      </div>

      {/* Table */}
      <div className="inv-table-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
              {['', 'Produk', 'HPP/ml', 'Stok', 'Status', 'Update Stok', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '0.65rem', fontWeight: 700,
                  color: 'var(--text-muted)', letterSpacing: '0.06em',
                  whiteSpace: 'nowrap'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 56, textAlign: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid var(--border-default)',
                    borderTopColor: 'var(--accent-red)',
                    animation: 'rotate-slow 0.8s linear infinite',
                    margin: '0 auto 12px'
                  }} />
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                    Memuat...
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 56, textAlign: 'center' }}>
                  <Package size={28} style={{ margin: '0 auto 12px', opacity: 0.25, display: 'block', color: 'var(--text-muted)' }} />
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    Tidak ada produk
                  </div>
                </td>
              </tr>
            ) : filteredProducts.map((product) => {
              const status = getStokStatus(product)
              const isSaving = saving === product.product_id
              const changed = hasChange(product.product_id)
              const edit = editStok[product.product_id] || {}

              return (
                <tr key={product.product_id} style={{
                  borderTop: '1px solid var(--border-default)',
                  transition: 'background 0.12s ease'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.018)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Foto */}
                  <td style={{ padding: '12px 16px', width: 52 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 8,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {product.image_filename && product.image_filename !== 'default.png' ? (
                        <img
                          src={`${API_URL}/uploads/products/${product.image_filename}`}
                          alt={product.product_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.1rem' }}>🧴</span>
                      )}
                    </div>
                  </td>

                  {/* Produk */}
                  <td style={{ padding: '12px 16px', minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                      {product.product_name}
                    </div>
                    <div style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      color: 'var(--accent-red)', marginBottom: 2
                    }}>{product.brand}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {[product.concentration, product.gender].filter(Boolean).join(' · ')}
                    </div>
                  </td>

                  {/* HPP */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {product.cost_price_per_ml ? (
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatRupiah(product.cost_price_per_ml)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 2 }}>/ml</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>

                  {/* Stok per ukuran — dengan mini bar */}
                  <td style={{ padding: '12px 16px', minWidth: 130 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {SIZES.map(s => {
                        const stok = product[`stock_${s}ml`] || 0
                        const maxRef = 20
                        const pct = Math.min(stok / maxRef, 1)
                        const barColor = stok <= 0 ? '#ef4444' : stok <= 3 ? '#f59e0b' : '#22c55e'
                        return (
                          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700,
                              color: 'var(--text-muted)', width: 24, flexShrink: 0
                            }}>{s}ml</span>
                            {/* mini bar */}
                            <div style={{
                              flex: 1, height: 4, borderRadius: 2,
                              background: 'var(--bg-elevated)', overflow: 'hidden',
                              maxWidth: 60
                            }}>
                              <div style={{
                                width: `${pct * 100}%`, height: '100%',
                                background: barColor, borderRadius: 2,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <span style={{
                              fontSize: '0.78rem', fontWeight: 700,
                              color: stok <= 0 ? '#ef4444' : stok <= 3 ? '#f59e0b' : 'var(--text-primary)',
                              width: 28, textAlign: 'right', flexShrink: 0
                            }}>{stok}</span>
                          </div>
                        )
                      })}
                    </div>
                  </td>

                  {/* Status — dot + label, clean */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 11px',
                      background: status.bg,
                      borderRadius: 100,
                      fontSize: '0.72rem', fontWeight: 700,
                      color: status.color,
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: status.dot, flexShrink: 0,
                        boxShadow: status.tier === 0 ? `0 0 0 2px ${status.dot}30` : 'none'
                      }} />
                      {status.label}
                    </span>
                  </td>

                  {/* Input stok */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {SIZES.map(s => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            color: 'var(--text-muted)', width: 24, flexShrink: 0
                          }}>{s}ml</span>
                          <input
                            type="number" min="0" step="1"
                            value={edit[s] ?? ''}
                            placeholder={String(product[`stock_${s}ml`] || 0)}
                            onChange={e => handleStokChange(product.product_id, s, e.target.value)}
                            style={{
                              width: 64, padding: '4px 8px',
                              background: 'var(--bg-input)',
                              border: `1px solid ${edit[s] !== undefined && edit[s] !== '' ? 'var(--accent-red)' : 'var(--border-default)'}`,
                              borderRadius: 6,
                              color: 'var(--text-primary)', fontSize: '0.82rem',
                              outline: 'none', fontFamily: 'var(--font-sans)',
                              fontWeight: 600, transition: 'border-color 0.15s ease'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                            onBlur={e => {
                              if (edit[s] === undefined || edit[s] === '')
                                e.target.style.borderColor = 'var(--border-default)'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleUpdateStok(product)}
                      disabled={!changed || isSaving}
                      style={{
                        padding: '7px 16px',
                        background: changed && !isSaving ? 'var(--accent-red)' : 'var(--bg-elevated)',
                        border: `1px solid ${changed && !isSaving ? 'transparent' : 'var(--border-default)'}`,
                        borderRadius: 6,
                        color: changed && !isSaving ? 'white' : 'var(--text-muted)',
                        cursor: changed && !isSaving ? 'pointer' : 'not-allowed',
                        fontSize: '0.75rem', fontWeight: 700,
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}>
                      {isSaving ? 'Menyimpan...' : 'Perbarui'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: '8px 18px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)', borderRadius: 6,
              color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.78rem'
            }}>← Prev</button>
          <span style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{
              padding: '8px 18px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)', borderRadius: 6,
              color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.78rem'
            }}>Next →</button>
        </div>
      )}

      <ConfirmModal
        show={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={doUpdateStok}
        loading={!!saving}
        title="Perbarui Stok?"
        message={buildConfirmMsg()}
        confirmLabel="Ya, Perbarui"
        confirmColor="var(--accent-red)"
      />
    </div>
  )
}