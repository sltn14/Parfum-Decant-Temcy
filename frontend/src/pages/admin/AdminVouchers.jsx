import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editVoucher, setEditVoucher] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', type: 'percentage', value: '',
    min_purchase: 0, max_discount: '',
    quota: 1, expired_at: '', is_active: true
  })
  const [deleteTarget, setDeleteTarget] = useState(null) // voucher_id
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchVouchers() }, [])

  const fetchVouchers = async () => {
    try {
      const res = await api.get('/vouchers/admin')
      setVouchers(res.data.vouchers)
    } catch { toast.error('Gagal memuat voucher') }
    finally { setLoading(false) }
  }

  const openModal = (voucher = null) => {
    if (voucher) {
      setEditVoucher(voucher)
      setForm({
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        min_purchase: voucher.min_purchase,
        max_discount: voucher.max_discount || '',
        quota: voucher.quota,
        expired_at: voucher.expired_at ? voucher.expired_at.slice(0, 10) : '',
        is_active: voucher.is_active
      })
    } else {
      setEditVoucher(null)
      setForm({
        code: '', type: 'percentage', value: '',
        min_purchase: 0, max_discount: '',
        quota: 1, expired_at: '', is_active: true
      })
    }
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        value: parseInt(form.value),
        min_purchase: parseInt(form.min_purchase) || 0,
        max_discount: form.max_discount ? parseInt(form.max_discount) : null,
        quota: parseInt(form.quota),
        expired_at: form.expired_at || null
      }
      if (editVoucher) {
        await api.put(`/vouchers/admin/${editVoucher.voucher_id}`, payload)
        toast.success('Voucher diupdate!')
      } else {
        await api.post('/vouchers/admin', payload)
        toast.success('Voucher dibuat!')
      }
      setShowModal(false)
      fetchVouchers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/vouchers/admin/${deleteTarget}`)
      toast.success('Voucher dihapus')
      setDeleteTarget(null)
      fetchVouchers()
    } catch { toast.error('Gagal menghapus') }
    finally { setDeleting(false) }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
    outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500
  }

  const labelStyle = {
    display: 'block', fontSize: '0.6rem', fontWeight: 800,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 6
  }

  return (
    <div>
      <style>{`
        .vouchers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .vouchers-h1 {
          font-family: var(--font-sans); font-size: 1.8rem;
          font-weight: 900; letter-spacing: -0.02em;
          text-transform: uppercase; color: var(--text-primary); margin: 0;
        }
        .vouchers-add-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: var(--accent-red); color: white;
          border-radius: var(--radius-sm); font-weight: 800;
          font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase;
          border: none; cursor: pointer;
        }
        .vouchers-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .vouchers-table-wrap table { min-width: 650px; }
        .vouchers-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        @media (max-width: 768px) {
          .vouchers-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .vouchers-h1 { font-size: 1.3rem !important; }
          .vouchers-add-btn { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      <div className="vouchers-header">
        <h1 className="vouchers-h1">VOUCHER</h1>
        <button onClick={() => openModal()} className="vouchers-add-btn">
          <Plus size={14} /> BUAT VOUCHER
        </button>
      </div>

      <div className="vouchers-table-wrap" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {['Kode', 'Tipe', 'Nilai', 'Min. Pembelian', 'Kuota', 'Kadaluarsa', 'Status', 'Aksi'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: '0.62rem', fontWeight: 800,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Memuat...
                </td>
              </tr>
            ) : vouchers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Belum ada voucher
                </td>
              </tr>
            ) : vouchers.map((v, i) => (
              <tr key={v.voucher_id} style={{
                borderTop: '1px solid var(--border-default)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
              }}>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontWeight: 800, fontSize: '0.85rem',
                    letterSpacing: '0.06em', color: 'var(--accent-red)'
                  }}>{v.code}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {v.type === 'percentage' ? 'Persentase' : 'Fixed'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {v.type === 'percentage' ? `${v.value}%` : formatRupiah(v.value)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {formatRupiah(v.min_purchase)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700 }}>{v.used_count}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/{v.quota}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {v.expired_at ? new Date(v.expired_at).toLocaleDateString('id-ID') : '∞'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-xs)',
                    fontSize: '0.62rem', fontWeight: 800,
                    background: v.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: v.is_active ? '#22c55e' : '#ef4444'
                  }}>
                    {v.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openModal(v)}
                      style={{
                        padding: '5px 10px',
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 'var(--radius-xs)',
                        color: '#3b82f6', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700
                      }}>Edit</button>
                    <button onClick={() => setDeleteTarget(v.voucher_id)}
                      style={{
                        padding: '5px 10px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 'var(--radius-xs)',
                        color: '#ef4444', cursor: 'pointer',
			fontSize: '0.72rem', fontWeight: 700,
			transition: 'all 0.15s ease'
                      }}
		      onMouseEnter={e => {
			e.currentTarget.style.background = '#ef4444'
    			e.currentTarget.style.color = 'white'
		      }}
		      onMouseLeave={e => {
			e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
    			e.currentTarget.style.color = '#ef4444'
		      }}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: 500, padding: 32,
            animation: 'scaleIn 0.25s ease'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24
            }}>
              <h2 style={{
                fontWeight: 900, fontSize: '0.95rem',
                textTransform: 'uppercase', letterSpacing: '-0.01em'
              }}>
                {editVoucher ? 'EDIT VOUCHER' : 'BUAT VOUCHER BARU'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="vouchers-modal-grid">
                <div>
                  <label style={labelStyle}>Kode Voucher</label>
                  <input type="text" value={form.code}
                    onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="DISKON50" required style={inputStyle}
                    disabled={!!editVoucher}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tipe</label>
                  <select value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Fixed (Rp)</option>
                  </select>
                </div>
              </div>

              <div className="vouchers-modal-grid">
                <div>
                  <label style={labelStyle}>
                    Nilai {form.type === 'percentage' ? '(%)' : '(Rp)'}
                  </label>
                  <input type="number" value={form.value}
                    onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                    required style={inputStyle} min={1}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Kuota</label>
                  <input type="number" value={form.quota}
                    onChange={e => setForm(prev => ({ ...prev, quota: e.target.value }))}
                    required style={inputStyle} min={1}
                  />
                </div>
              </div>

              <div className="vouchers-modal-grid">
                <div>
                  <label style={labelStyle}>Min. Pembelian (Rp)</label>
                  <input type="number" value={form.min_purchase}
                    onChange={e => setForm(prev => ({ ...prev, min_purchase: e.target.value }))}
                    style={inputStyle} min={0}
                  />
                </div>
                {form.type === 'percentage' && (
                  <div>
                    <label style={labelStyle}>Max Diskon (Rp)</label>
                    <input type="number" value={form.max_discount}
                      onChange={e => setForm(prev => ({ ...prev, max_discount: e.target.value }))}
                      placeholder="Kosongkan = unlimited" style={inputStyle} min={0}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Kadaluarsa <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span></label>
                <input type="date" value={form.expired_at}
                  onChange={e => setForm(prev => ({ ...prev, expired_at: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'
                }}>
                  <div
                    onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                    style={{
                      width: 18, height: 18, borderRadius: 4,
                      background: form.is_active ? 'var(--accent-red)' : 'var(--bg-elevated)',
                      border: `1px solid ${form.is_active ? 'var(--accent-red)' : 'var(--border-default)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s ease'
                    }}>
                    {form.is_active && <span style={{ color: 'white', fontSize: '0.7rem' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Voucher aktif
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)', fontWeight: 800,
                    fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}>BATAL</button>
                <button type="submit" disabled={saving}
                  style={{
                    flex: 2, padding: '12px',
                    background: saving ? 'var(--border-hover)' : 'var(--accent-red)',
                    color: 'white', fontWeight: 800,
                    fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderRadius: 'var(--radius-sm)', border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                  <Save size={13} />
                  {saving ? 'MENYIMPAN...' : editVoucher ? 'UPDATE' : 'BUAT VOUCHER'}
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
  	title="HAPUS VOUCHER?"
  	message="Voucher ini akan dihapus permanen. User yang sudah punya kode tidak bisa memakainya lagi."
  	confirmLabel="YA, HAPUS"
      />
    </div>
  )
}