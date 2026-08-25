import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X, Save } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({
    brand: '', product_name: '', concentration: '', gender: 'Unisex',
    top_notes: '', middle_notes: '', base_notes: '', main_accords: '',
    longevity_display: '', description: '', pros: '', cons: '',
    price_1ml: '', price_2ml: '', price_3ml: '', price_5ml: '',
    stock_ml: '', is_active: true
  })

  useEffect(() => {
    fetchProducts()
  }, [page, search])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      const res = await api.get(`/products?${params}`)
      setProducts(res.data.products)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch {
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (product = null) => {
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
      setForm({
        brand: '', product_name: '', concentration: '', gender: 'Unisex',
        top_notes: '', middle_notes: '', base_notes: '', main_accords: '',
        longevity_display: '', description: '', pros: '', cons: '',
        price_1ml: '', price_2ml: '', price_3ml: '', price_5ml: '',
        stock_ml: '', is_active: true
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct.product_id}`, form)
        toast.success('Produk berhasil diupdate!')
      } else {
        await api.post('/products', form)
        toast.success('Produk berhasil ditambahkan!')
      }
      setShowModal(false)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan produk')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus produk ini?')) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Produk berhasil dihapus!')
      fetchProducts()
    } catch {
      toast.error('Gagal menghapus produk')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
    fontFamily: 'var(--font-sans)'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Manajemen Produk
        </h1>
        <button onClick={() => handleOpenModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: 'var(--accent-red)', color: 'white',
            borderRadius: 'var(--radius-md)', fontWeight: 600,
            border: 'none', cursor: 'pointer'
          }}>
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px', marginBottom: 24, maxWidth: 400
      }}>
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text" placeholder="Cari produk..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}
        />
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
              {['Produk', 'Brand', 'Tipe', 'Harga 1ml', 'Stok', 'Status', 'Aksi'].map(h => (
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
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Memuat...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Tidak ada produk
                </td>
              </tr>
            ) : (
              products.map((product, i) => (
                <tr key={product.product_id} style={{
                  borderTop: '1px solid var(--border-default)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{product.product_name}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {product.brand}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {product.concentration}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {formatRupiah(product.price_1ml)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {product.stock_ml} ml
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem', fontWeight: 600,
                      background: product.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: product.is_active ? '#22c55e' : '#ef4444'
                    }}>
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleOpenModal(product)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(59,130,246,0.1)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#3b82f6', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: '0.8rem'
                        }}>
                        <Edit size={13} /> Edit
                      </button>
                      <button onClick={() => handleDelete(product.product_id)}
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
                    </div>
                  </td>
                </tr>
              ))
            )}
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

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: 700,
            maxHeight: '90vh', overflow: 'auto',
            padding: 32
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {editProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 5 }}>
                      {label}
                    </label>
                    <input type={type} value={form[name]}
                      onChange={e => setForm({ ...form, [name]: e.target.value })}
                      required={required} placeholder={placeholder}
                      style={inputStyle} />
                  </div>
                ))}

                {/* Gender */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 5 }}>
                    Gender
                  </label>
                  <select value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    style={inputStyle}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 5 }}>
                    Status
                  </label>
                  <select value={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}
                    style={inputStyle}>
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
                <div key={name} style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 5 }}>
                    {label}
                  </label>
                  <textarea value={form[name]}
                    onChange={e => setForm({ ...form, [name]: e.target.value })}
                    rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer'
                  }}>
                  Batal
                </button>
                <button type="submit"
                  style={{
                    flex: 2, padding: '12px',
                    background: 'var(--accent-red)', color: 'white',
                    borderRadius: 'var(--radius-md)', fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                  <Save size={16} />
                  {editProduct ? 'Update Produk' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}