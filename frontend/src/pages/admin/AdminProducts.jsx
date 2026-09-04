import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Edit, Trash2, X, Save, Upload } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const API_URL = 'http://localhost:5000'

const EMPTY_FORM = {
  brand: '', product_name: '', concentration: '', gender: 'Unisex',
  top_notes: '', middle_notes: '', base_notes: '', main_accords: '',
  longevity_display: '', description: '', pros: '', cons: '',
  price_1ml: '', price_2ml: '', price_3ml: '', price_5ml: '',
  stock_ml: '', is_active: true
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
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => {
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

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus produk ini?')) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Produk berhasil dihapus!')
      fetchProducts()
    } catch { toast.error('Gagal menghapus') }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.82rem',
    outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500,
    transition: 'border-color 0.2s ease'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 8
          }}>Kelola</div>
          <h1 style={{
            fontWeight: 900, fontSize: '1.8rem',
            letterSpacing: '-0.02em', textTransform: 'uppercase',
            color: 'var(--text-primary)'
          }}>MANAJEMEN PRODUK</h1>
        </div>
        <button onClick={() => openModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px',
            background: 'var(--accent-red)', color: 'white',
            borderRadius: 'var(--radius-sm)', fontWeight: 800,
            fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(240,46,41,0.3)'
          }}>
          <Plus size={14} /> TAMBAH PRODUK
        </button>
      </div>

      {/* Search + Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px', maxWidth: 360, flex: 1
        }}
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
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{total}</span> produk
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {['Foto', 'Produk', 'Brand', 'Tipe', 'Harga 1ml', 'Stok', 'Status', 'Aksi'].map(h => (
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
              <tr key={product.product_id} style={{
                borderTop: '1px solid var(--border-default)',
                transition: 'background 0.15s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Foto */}
                <td style={{ padding: '10px 16px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {product.image_filename ? (
                      <img
                        src={`${API_URL}/uploads/products/${product.image_filename}`}
                        alt={product.product_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>🧴</span>
                    )}
                  </div>
                </td>

                <td style={{ padding: '10px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '-0.01em' }}>
                    {product.product_name}
                  </div>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--accent-red)'
                  }}>{product.brand}</span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {product.concentration}
                </td>
                <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {formatRupiah(product.price_1ml)}
                </td>
                <td style={{ padding: '10px 16px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {product.stock_ml} ml
                </td>
                <td style={{ padding: '10px 16px' }}>
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
                <td style={{ padding: '10px 16px' }}>
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
                    <button onClick={() => handleDelete(product.product_id)}
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

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: 720,
            maxHeight: '92vh', overflow: 'auto',
            padding: 32, animation: 'scaleIn 0.25s ease'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24
            }}>
              <h2 style={{
                fontWeight: 900, fontSize: '0.95rem',
                textTransform: 'uppercase', letterSpacing: '-0.01em'
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
                  {/* Preview */}
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
                    <div style={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: 'var(--text-secondary)', marginBottom: 3
                    }}>
                      {imagePreview
                        ? 'Foto dipilih — klik untuk ganti'
                        : editProduct?.image_filename
                          ? 'Ada foto — klik untuk ganti'
                          : 'Klik untuk pilih foto produk'
                      }
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      JPG, PNG, WEBP · Maks 5MB
                    </div>
                  </div>

                  <Upload size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              </div>

              {/* Form fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Brand', name: 'brand', required: true },
                  { label: 'Nama Produk', name: 'product_name', required: true },
                  { label: 'Konsentrasi', name: 'concentration', placeholder: 'EDP / EDT / Extrait' },
                  { label: 'Ketahanan', name: 'longevity_display', placeholder: '6-8 jam' },
                  { label: 'Harga 1ml', name: 'price_1ml', type: 'number' },
                  { label: 'Harga 2ml', name: 'price_2ml', type: 'number' },
                  { label: 'Harga 3ml', name: 'price_3ml', type: 'number' },
                  { label: 'Harga 5ml', name: 'price_5ml', type: 'number' },
                  { label: 'Stok (ml)', name: 'stock_ml', type: 'number' },
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
    </div>
  )
}