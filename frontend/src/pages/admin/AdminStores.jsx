import { useState, useEffect } from 'react'
import { Plus, Edit, X, Save, MapPin, Phone, ExternalLink, Power } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', city: '', address: '', phone: '', maps_url: '' }

export default function AdminStores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editStore, setEditStore] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => { fetchStores() }, [])

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores/admin')
      setStores(res.data.stores)
    } catch { toast.error('Gagal memuat daftar store') }
    finally { setLoading(false) }
  }

  const openModal = (store = null) => {
    setEditStore(store)
    setForm(store ? {
      name: store.name || '',
      city: store.city || '',
      address: store.address || '',
      phone: store.phone || '',
      maps_url: store.maps_url || ''
    } : EMPTY_FORM)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editStore) {
        await api.put(`/stores/admin/${editStore.store_id}`, form)
        toast.success('Store diupdate!')
      } else {
        await api.post('/stores/admin', form)
        toast.success('Store ditambahkan!')
      }
      setShowModal(false)
      fetchStores()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleToggle = async (store) => {
    try {
      const res = await api.put(`/stores/admin/${store.store_id}/toggle`)
      toast.success(res.data.message)
      fetchStores()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status')
    }
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

  const focus = e => { e.target.style.borderColor = 'var(--accent-red)' }
  const blur = e => { e.target.style.borderColor = 'var(--border-default)' }

  return (
    <div>
      <style>{`
        .st-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 28px; }
        .st-label-tag { font-size: 0.62rem; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent-red); margin-bottom: 8px; }
        .st-h1 { font-weight: 900; font-size: 1.8rem; letter-spacing: -0.02em; text-transform: uppercase; color: var(--text-primary); margin: 0; }
        .st-add-btn {
          display: flex; align-items: center; gap: 8px; padding: 10px 20px;
          background: var(--accent-red); color: white; border: none; cursor: pointer;
          border-radius: var(--radius-sm); font-weight: 800; font-size: 0.72rem;
          letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap;
        }
        .st-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
        .st-card {
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; gap: 10px;
        }
        .st-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .st-name { font-weight: 800; font-size: 0.95rem; line-height: 1.3; }
        .st-city { font-size: 0.62rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent-red); margin-top: 2px; }
        .st-badge { padding: 3px 10px; border-radius: var(--radius-xs); font-size: 0.6rem; font-weight: 800; white-space: nowrap; }
        .st-row { display: flex; gap: 8px; align-items: flex-start; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }
        .st-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; padding-top: 12px; border-top: 1px dashed var(--border-default); }
        .st-btn {
          display: flex; align-items: center; gap: 5px; padding: 6px 12px; cursor: pointer;
          border-radius: var(--radius-xs); font-size: 0.68rem; font-weight: 800;
        }
        .st-modal-overlay {
          position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(8px);
        }
        .st-modal {
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--radius-lg); width: 100%; max-width: 480px; padding: 28px;
          max-height: 92vh; overflow-y: auto; animation: scaleIn 0.25s ease;
        }
        @media (max-width: 768px) {
          .st-header { flex-direction: column; align-items: stretch; margin-bottom: 18px; }
          .st-h1 { font-size: 1.3rem; }
          .st-add-btn { width: 100%; justify-content: center; }
          .st-grid { grid-template-columns: 1fr; gap: 10px; }
          .st-card { padding: 14px; }
          .st-modal-overlay { padding: 0; align-items: flex-end; }
          .st-modal { max-width: 100%; padding: 20px 16px; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
        }
      `}</style>

      <div className="st-header">
        <div>
          <div className="st-label-tag">Kelola</div>
          <h1 className="st-h1">CABANG TOKO</h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
            Lokasi yang bisa dipilih customer saat memilih metode pickup
          </div>
        </div>
        <button className="st-add-btn" onClick={() => openModal()}>
          <Plus size={14} /> TAMBAH STORE
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>
          MEMUAT...
        </div>
      ) : stores.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>
          BELUM ADA STORE
        </div>
      ) : (
        <div className="st-grid">
          {stores.map(store => (
            <div key={store.store_id} className="st-card" style={{ opacity: store.is_active ? 1 : 0.65 }}>
              <div className="st-card-top">
                <div style={{ minWidth: 0 }}>
                  <div className="st-name">{store.name}</div>
                  <div className="st-city">{store.city}</div>
                </div>
                <span className="st-badge" style={{
                  background: store.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: store.is_active ? '#22c55e' : '#ef4444'
                }}>{store.is_active ? 'AKTIF' : 'NONAKTIF'}</span>
              </div>

              <div className="st-row">
                <MapPin size={14} style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />
                <span>{store.address}</span>
              </div>
              {store.phone && (
                <div className="st-row">
                  <Phone size={14} style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />
                  <span>{store.phone}</span>
                </div>
              )}
              {store.maps_url && (
                <div className="st-row">
                  <ExternalLink size={14} style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />
                  <a href={store.maps_url} target="_blank" rel="noreferrer"
                    style={{ color: '#3b82f6', wordBreak: 'break-all' }}>Lihat di Maps</a>
                </div>
              )}

              <div className="st-actions">
                <button className="st-btn" onClick={() => openModal(store)} style={{
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6'
                }}><Edit size={12} /> EDIT</button>
                <button className="st-btn" onClick={() => handleToggle(store)} style={{
                  background: store.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                  border: `1px solid ${store.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                  color: store.is_active ? '#ef4444' : '#22c55e'
                }}><Power size={12} /> {store.is_active ? 'NONAKTIFKAN' : 'AKTIFKAN'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="st-modal-overlay">
          <div className="st-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', margin: 0 }}>
                {editStore ? 'EDIT STORE' : 'TAMBAH STORE BARU'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nama Store *</label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Decant Temcy Semarang" style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Kota *</label>
                  <input type="text" required value={form.city}
                    onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Semarang" style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Alamat Lengkap *</label>
                  <textarea required rows={3} value={form.address}
                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Jl. ... No. ..., Kecamatan, Kota"
                    style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>No. Telepon / WhatsApp</label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx" style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Link Google Maps <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span></label>
                  <input type="url" value={form.maps_url}
                    onChange={e => setForm(prev => ({ ...prev, maps_url: e.target.value }))}
                    placeholder="https://maps.app.goo.gl/..." style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: 12, background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.72rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer'
                  }}>BATAL</button>
                <button type="submit" disabled={saving}
                  style={{
                    flex: 2, padding: 12, background: saving ? 'var(--border-hover)' : 'var(--accent-red)',
                    color: 'white', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em',
                    textTransform: 'uppercase', borderRadius: 'var(--radius-sm)', border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                  <Save size={13} />
                  {saving ? 'MENYIMPAN...' : editStore ? 'UPDATE' : 'TAMBAH STORE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}