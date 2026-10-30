import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Edit, Trash2, X, Save, Upload, Droplets } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const API_URL = 'http://localhost:5000'

const EMPTY_FORM = {
  brand: '', product_name: '', concentration: '', gender: 'Unisex',
  top_notes: '', middle_notes: '', base_notes: '', main_accords: '',
  longevity_display: '', description: '', pros: '', cons: '',
  price_1ml: '', price_2ml: '', price_3ml: '', price_5ml: '',
  stock_ml: '', stock_ml_initial: '', is_active: true
}

// Komponen progress bar stok ml
const StockMlBar = ({ stockMl, stockMlInitial, compact = false }) => {
  const current = parseFloat(stockMl) || 0
  const initial = parseFloat(stockMlInitial) || parseFloat(stockMl) || 0
  const pct = initial > 0 ? Math.min(100, (current / initial) * 100) : (current > 0 ? 100 : 0)

  let barColor = '#22c55e'
  let label = 'AMAN'
  if (pct <= 20) { barColor = '#ef4444'; label = 'KRITIS' }
  else if (pct <= 40) { barColor = '#f59e0b'; label = 'MENIPIS' }

  if (compact) {
    return (
      <div className="stock-ml-compact">
        <div className="stock-ml-compact-row">
          <Droplets size={10} style={{ color: barColor, flexShrink: 0 }} />
          <span className="stock-ml-value" style={{ color: barColor }}>{current} ml</span>
          {initial > 0 && current !== initial && (
            <span className="stock-ml-initial">/ {initial} ml</span>
          )}
        </div>
        <div className="stock-ml-bar-track">
          <div className="stock-ml-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>
      </div>
    )
  }

  return (
    <div className="stock-ml-full">
      <div className="stock-ml-full-row">
        <div className="stock-ml-full-left">
          <Droplets size={13} style={{ color: barColor }} />
          <span className="stock-ml-full-value" style={{ color: barColor }}>{current} ml tersisa</span>
        </div>
        <span className="stock-ml-full-badge" style={{
          background: `${barColor}18`,
          border: `1px solid ${barColor}30`,
          color: barColor
        }}>{label}</span>
      </div>
      {initial > 0 && (
        <>
          <div className="stock-ml-bar-track-full">
            <div className="stock-ml-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <div className="stock-ml-full-meta">
            <span>{Math.round(pct)}% dari {initial} ml</span>
            {current !== initial && <span>Terpakai: {Math.max(0, initial - current)} ml</span>}
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const imgRef = useRef()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchProducts() }, [page, search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      const res = await api.get(`/products?${params}`)
      setProducts(res.data.products)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch { toast.error('Gagal memuat produk') }
    finally { setLoading(false) }
  }

  const openModal = (product = null) => {
    setImageFile(null)
    setImagePreview(null)
    if (product) {
      setEditProduct(product)
      setForm({
        brand: product.brand || '',
        product_name: product.product_name || '',
        concentration: product.concentration || '',
        gender: product.gender || 'Unisex',
        top_notes: product.top_notes || '',
        middle_notes: product.middle_notes || '',
        base_notes: product.base_notes || '',
        main_accords: product.main_accords || '',
        longevity_display: product.longevity_display || '',
        description: product.description || '',
        pros: product.pros || '',
        cons: product.cons || '',
        price_1ml: product.price_1ml || '',
        price_2ml: product.price_2ml || '',
        price_3ml: product.price_3ml || '',
        price_5ml: product.price_5ml || '',
        stock_ml: product.stock_ml || '',
        stock_ml_initial: product.stock_ml_initial || product.stock_ml || '',
        is_active: product.is_active
      })
    } else {
      setEditProduct(null)
      setForm(EMPTY_FORM)
    }
    setShowModal(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran foto maksimal 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // stock_ml_initial = baseline progress bar. stock_ml dihitung otomatis dari Inventaris
  const handleStockInitialChange = (val) => {
    setForm(prev => ({ ...prev, stock_ml_initial: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      const submitForm = { ...form }
      // stock_ml dihitung server dari stok vial (Inventaris), jangan dikirim
      delete submitForm.stock_ml
      Object.entries(submitForm).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) formData.append(k, v)
      })
      if (imageFile) formData.append('image', imageFile)

      if (editProduct) {
        await api.put(`/products/${editProduct.product_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Produk berhasil diupdate!')
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Produk berhasil ditambahkan!')
      }
      setShowModal(false)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/products/${deleteTarget}`)
      toast.success('Produk berhasil dihapus!')
      setDeleteTarget(null)
      fetchProducts()
    } catch { toast.error('Gagal menghapus') }
    finally { setDeleting(false) }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.82rem',
    outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500,
    transition: 'border-color 0.2s ease', boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.58rem', fontWeight: 800,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 5
  }

  const currentImageSrc = imagePreview
    || (editProduct?.image_filename
      ? `${API_URL}/uploads/products/${editProduct.image_filename}`
      : null)

  return (
    <div>
      <style>{`
        /* === ADMIN PRODUCTS === */
        .ap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .ap-label-tag {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent-red);
          margin-bottom: 8px;
        }
        .ap-h1 {
          font-weight: 900;
          font-size: 1.8rem;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: var(--text-primary);
          margin: 0;
        }
        .ap-add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          background: var(--accent-red);
          color: white;
          border-radius: var(--radius-sm);
          font-weight: 800;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(240,46,41,0.3);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ap-search-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .ap-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          max-width: 360px;
          flex: 1;
          transition: border-color 0.2s ease;
        }
        .ap-count {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ap-table-wrap {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .ap-table {
          width: 100%;
          border-collapse: collapse;
        }
        .ap-th {
          padding: 11px 16px;
          text-align: left;
          font-size: 0.58rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          background: var(--bg-elevated);
        }
        .ap-td {
          padding: 10px 16px;
          border-top: 1px solid var(--border-default);
        }
        /* Stok ML styles */
        .stock-ml-compact {
          min-width: 90px;
        }
        .stock-ml-compact-row {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }
        .stock-ml-value {
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .stock-ml-initial {
          font-size: 0.62rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .stock-ml-bar-track {
          width: 100%;
          height: 3px;
          background: var(--bg-elevated);
          border-radius: 99px;
          overflow: hidden;
        }
        .stock-ml-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.5s ease;
        }
        .stock-ml-full {
          margin-bottom: 4px;
        }
        .stock-ml-full-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .stock-ml-full-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stock-ml-full-value {
          font-size: 0.88rem;
          font-weight: 800;
        }
        .stock-ml-full-badge {
          font-size: 0.55rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          padding: 3px 8px;
          border-radius: var(--radius-xs);
        }
        .stock-ml-bar-track-full {
          width: 100%;
          height: 6px;
          background: var(--bg-elevated);
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .stock-ml-full-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.62rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        /* Modal */
        .ap-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          backdrop-filter: blur(8px);
        }
        .ap-modal {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 720px;
          max-height: 92vh;
          overflow: auto;
          padding: 32px;
          animation: scaleIn 0.25s ease;
        }
        .ap-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .ap-stock-section {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-top: 4px;
        }
        .ap-stock-section-title {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent-red);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ap-stock-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        /* === MOBILE (≤768px) === */
        @media (max-width: 768px) {
          .ap-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            margin-bottom: 20px !important;
          }
          .ap-h1 {
            font-size: 1.3rem !important;
          }
          .ap-add-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .ap-search-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .ap-search-box {
            max-width: 100% !important;
          }
          .ap-count {
            text-align: right !important;
          }
          .ap-modal-overlay {
            padding: 12px !important;
            align-items: flex-end !important;
          }
          .ap-modal {
            padding: 20px 16px !important;
            border-radius: var(--radius-md) var(--radius-md) 0 0 !important;
            max-height: 95vh !important;
          }
          .ap-modal-grid {
            grid-template-columns: 1fr !important;
          }
          .ap-stock-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="ap-header">
        <div>
          <div className="ap-label-tag">Kelola</div>
          <h1 className="ap-h1">MANAJEMEN PRODUK</h1>
        </div>
        <button onClick={() => openModal()} className="ap-add-btn">
          <Plus size={14} /> TAMBAH PRODUK
        </button>
      </div>

      {/* Search + Total */}
      <div className="ap-search-row">
        <div className="ap-search-box"
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(240,46,41,0.3)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
        >
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Cari produk..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.85rem',
              fontFamily: 'var(--font-sans)', fontWeight: 500
            }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ color: 'var(--text-muted)', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="ap-count">
          <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{total}</span> produk
        </div>
      </div>

      {/* Table */}
      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              {['Foto', 'Produk', 'Brand', 'Tipe', 'Harga 1ml', 'Sisa Stok', 'Status', 'Aksi'].map(h => (
                <th key={h} className="ap-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>
                  MEMUAT...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>
                  TIDAK ADA PRODUK
                </td>
              </tr>
            ) : products.map((product) => (
              <tr key={product.product_id}
                style={{ transition: 'background 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Foto */}
                <td className="ap-td">
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {product.image_filename ? (
                      <img src={`${API_URL}/uploads/products/${product.image_filename}`}
                        alt={product.product_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>🧴</span>
                    )}
                  </div>
                </td>
                <td className="ap-td">
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '-0.01em' }}>
                    {product.product_name}
                  </div>
                </td>
                <td className="ap-td">
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--accent-red)'
                  }}>{product.brand}</span>
                </td>
                <td className="ap-td" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {product.concentration}
                </td>
                <td className="ap-td" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {formatRupiah(product.price_1ml)}
                </td>
                {/* Kolom Sisa Stok dengan progress bar */}
                <td className="ap-td">
                  {(product.stock_ml !== null && product.stock_ml !== undefined && product.stock_ml !== '') ? (
                    <StockMlBar
                      stockMl={product.stock_ml}
                      stockMlInitial={product.stock_ml_initial || product.stock_ml}
                      compact
                    />
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>—</span>
                  )}
                </td>
                <td className="ap-td">
                  <span style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-xs)',
                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                    background: product.is_active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    color: product.is_active ? '#22c55e' : '#ef4444',
                    border: `1px solid ${product.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`
                  }}>
                    {product.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>
                <td className="ap-td">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openModal(product)}
                      style={{
                        padding: '5px 12px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 'var(--radius-xs)',
                        color: '#3b82f6', cursor: 'pointer',
                        fontSize: '0.62rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s ease'
                      }}>
                      <Edit size={11} /> EDIT
                    </button>
                    <button onClick={() => setDeleteTarget(product.product_id)}
                      style={{
                        padding: '5px 12px',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 'var(--radius-xs)',
                        color: '#ef4444', cursor: 'pointer',
                        fontSize: '0.62rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s ease'
                      }}>
                      <Trash2 size={11} /> HAPUS
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: '8px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.75rem'
            }}>← PREV</button>
          <span style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{
              padding: '8px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.75rem'
            }}>NEXT →</button>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="ap-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="ap-modal">
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24
            }}>
              <h2 style={{
                fontWeight: 900, fontSize: '0.95rem',
                textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0
              }}>
                {editProduct ? 'EDIT PRODUK' : 'TAMBAH PRODUK BARU'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Upload Foto */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Foto Produk</label>
                <input ref={imgRef} type="file" accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px dashed var(--border-hover)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  transition: 'border-color 0.2s ease'
                }}
                  onClick={() => imgRef.current.click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-red)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {currentImageSrc ? (
                      <img src={currentImageSrc} alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>🧴</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 3 }}>
                      {imagePreview ? 'Foto dipilih — klik untuk ganti' : editProduct?.image_filename ? 'Ada foto — klik untuk ganti' : 'Klik untuk pilih foto produk'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      JPG, PNG, WEBP · Maks 5MB
                    </div>
                  </div>
                  <Upload size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              </div>

              {/* Stok ML Section — di atas form utama supaya keliatan duluan */}
              <div className="ap-stock-section" style={{ marginBottom: 20 }}>
                <div className="ap-stock-section-title">
                  <Droplets size={12} /> Stok Parfum (ml)
                </div>
                <div className="ap-stock-grid">
                  {editProduct && (
                    <div>
                      <label style={labelStyle}>Sisa ML Sekarang (Otomatis)</label>
                      <input type="number" value={form.stock_ml || 0} readOnly disabled
                        style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                      />
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                        Dari Inventaris: {[1, 2, 3, 5].map(s => `${s}ml×${editProduct?.[`stock_${s}ml`] || 0}`).join(' + ')}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>Kapasitas / Stok ML Awal (Referensi)</label>
                    <input type="number" value={form.stock_ml_initial}
                      onChange={e => handleStockInitialChange(e.target.value)}
                      placeholder="Contoh: 100"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                    />
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                      {editProduct
                        ? 'Total ml awal untuk hitung persentase progress bar'
                        : 'Total ml awal parfum. Isi stok vial per ukuran di menu Inventaris setelah produk dibuat'}
                    </div>
                  </div>
                </div>

                {/* Preview progress bar di modal (hanya saat edit) */}
                {editProduct && (form.stock_ml || form.stock_ml_initial) && (
                  <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
                    <StockMlBar
                      stockMl={form.stock_ml || 0}
                      stockMlInitial={form.stock_ml_initial || form.stock_ml}
                    />
                  </div>
                )}
              </div>

              {/* Form fields grid */}
              <div className="ap-modal-grid">
                {[
                  { label: 'Brand', name: 'brand', required: true },
                  { label: 'Nama Produk', name: 'product_name', required: true },
                  { label: 'Konsentrasi', name: 'concentration', placeholder: 'EDP / EDT / Extrait' },
                  { label: 'Ketahanan', name: 'longevity_display', placeholder: '6-8 jam' },
                  { label: 'Harga 1ml', name: 'price_1ml', type: 'number' },
                  { label: 'Harga 2ml', name: 'price_2ml', type: 'number' },
                  { label: 'Harga 3ml', name: 'price_3ml', type: 'number' },
                  { label: 'Harga 5ml', name: 'price_5ml', type: 'number' },
                ].map(({ label, name, type = 'text', required, placeholder }) => (
                  <div key={name}>
                    <label style={labelStyle}>{label}</label>
                    <input type={type} value={form[name]}
                      onChange={e => setForm({ ...form, [name]: e.target.value })}
                      required={required} placeholder={placeholder}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                    />
                  </div>
                ))}

                <div>
                  <label style={labelStyle}>Gender</label>
                  <select value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Textarea fields */}
              {[
                { label: 'Top Notes', name: 'top_notes' },
                { label: 'Middle Notes', name: 'middle_notes' },
                { label: 'Base Notes', name: 'base_notes' },
                { label: 'Main Accords', name: 'main_accords' },
                { label: 'Deskripsi', name: 'description' },
                { label: 'Kelebihan', name: 'pros' },
                { label: 'Kekurangan', name: 'cons' },
              ].map(({ label, name }) => (
                <div key={name} style={{ marginTop: 14 }}>
                  <label style={labelStyle}>{label}</label>
                  <textarea value={form[name]}
                    onChange={e => setForm({ ...form, [name]: e.target.value })}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
              ))}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)', fontWeight: 800,
                    fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}>BATAL</button>
                <button type="submit" disabled={saving}
                  style={{
                    flex: 2, padding: '12px',
                    background: saving ? 'var(--border-hover)' : 'var(--accent-red)',
                    color: 'white', fontWeight: 800,
                    fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    borderRadius: 'var(--radius-sm)', border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: saving ? 'none' : '0 4px 14px rgba(240,46,41,0.3)'
                  }}>
                  <Save size={13} />
                  {saving ? 'MENYIMPAN...' : editProduct ? 'UPDATE PRODUK' : 'SIMPAN PRODUK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="HAPUS PRODUK?"
        message="Produk ini akan dinonaktifkan dan tidak akan tampil di katalog. Tindakan ini bisa diurungkan melalui edit produk."
        confirmLabel="YA, HAPUS"
      />
    </div>
  )
}