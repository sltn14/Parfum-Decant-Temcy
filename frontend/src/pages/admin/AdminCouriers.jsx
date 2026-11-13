import { useState, useEffect } from 'react'
import { Plus, Trash2, Power, Truck, Pencil } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const EMPTY_FORM = { code: '', name: '' }

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null) // kurir yang sedang diedit
  const [editForm, setEditForm] = useState({ code: '', name: '', sort_order: 0 })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => { fetchCouriers() }, [])

  const fetchCouriers = async () => {
    try {
      const res = await api.get('/couriers/admin')
      setCouriers(res.data.couriers)
    } catch { toast.error('Gagal memuat daftar kurir') }
    finally { setLoading(false) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/couriers/admin', {
        code: form.code.trim().toLowerCase(),
        name: form.name.trim()
      })
      toast.success('Kurir ditambahkan!')
      setForm(EMPTY_FORM)
      fetchCouriers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambah kurir')
    } finally { setSaving(false) }
  }

  const handleToggle = async (c) => {
    try {
      await api.put(`/couriers/admin/${c.courier_id}`, { is_active: !c.is_active })
      toast.success(c.is_active ? 'Kurir dinonaktifkan' : 'Kurir diaktifkan')
      fetchCouriers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status')
    }
  }

  const openEdit = (c) => {
    setEditTarget(c)
    setEditForm({ code: c.code, name: c.name, sort_order: c.sort_order })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    const sort = Number(editForm.sort_order)
    if (!Number.isInteger(sort) || sort < 0 || sort > 9999) { toast.error('Urutan harus bilangan bulat 0-9999'); return }
    const body = { name: editForm.name.trim(), sort_order: sort }
    // COD dikunci: kodenya tidak ikut dikirim
    if (editTarget.code !== 'cod') body.code = editForm.code.trim().toLowerCase()
    setEditSaving(true)
    try {
      await api.put(`/couriers/admin/${editTarget.courier_id}`, body)
      toast.success('Kurir diperbarui!')
      setEditTarget(null)
      fetchCouriers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui kurir')
    } finally { setEditSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/couriers/admin/${deleteTarget.courier_id}`)
      toast.success('Kurir dihapus')
      setDeleteTarget(null)
      fetchCouriers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kurir')
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

  return (
    <div>
      <style>{`
        .kr-label-tag { font-size: 0.62rem; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent-red); margin-bottom: 8px; }
        .kr-h1 { font-weight: 900; font-size: 1.8rem; letter-spacing: -0.02em; text-transform: uppercase; color: var(--text-primary); margin: 0; }
        .kr-card { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 18px; }
        .kr-form { display: grid; grid-template-columns: 1fr 2fr auto; gap: 12px; align-items: flex-end; }
        .kr-add-btn {
          display: flex; align-items: center; gap: 8px; padding: 11px 20px; background: var(--accent-red); color: white;
          border: none; cursor: pointer; border-radius: var(--radius-sm); font-weight: 800; font-size: 0.72rem;
          letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap;
        }
        .kr-add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .kr-list { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
        .kr-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .kr-name { font-weight: 800; font-size: 0.95rem; }
        .kr-code { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-top: 2px; }
        .kr-badge { padding: 3px 10px; border-radius: var(--radius-xs); font-size: 0.6rem; font-weight: 800; white-space: nowrap; }
        .kr-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; cursor: pointer; border-radius: var(--radius-xs); font-size: 0.68rem; font-weight: 800; }
        .kr-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(8px); }
        .kr-modal { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); width: 100%; max-width: 420px; padding: 24px; }
        @media (max-width: 768px) {
          .kr-h1 { font-size: 1.3rem; }
          .kr-form { grid-template-columns: 1fr; }
          .kr-add-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <div className="kr-label-tag">Kelola</div>
        <h1 className="kr-h1">KURIR PENGIRIMAN</h1>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
          Kurir yang aktif akan muncul sebagai pilihan saat checkout
        </div>
      </div>

      <form className="kr-card" onSubmit={handleAdd}>
        <div className="kr-form">
          <div>
            <label style={labelStyle}>Kode kurir</label>
            <input style={inputStyle} value={form.code} placeholder="mis. anteraja"
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required maxLength={30} />
          </div>
          <div>
            <label style={labelStyle}>Nama tampilan</label>
            <input style={inputStyle} value={form.name} placeholder="mis. AnterAja"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={60} />
          </div>
          <button type="submit" className="kr-add-btn" disabled={saving}>
            <Plus size={14} /> {saving ? 'MENYIMPAN...' : 'TAMBAH'}
          </button>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
          Kode harus sama dengan kode kurir RajaOngkir (huruf kecil, tanpa spasi), supaya ongkir bisa dihitung.
          Kode <b>cod</b> = diantar owner, ongkir Rp 0.
        </div>
      </form>

      <div className="kr-list">
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat...</div>
        ) : couriers.length === 0 ? (
          <div className="kr-card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Belum ada kurir. Tambahkan di atas.
          </div>
        ) : couriers.map(c => (
          <div key={c.courier_id} className="kr-card kr-item" style={{ opacity: c.is_active ? 1 : 0.65 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Truck size={18} style={{ color: 'var(--accent-red)' }} />
              <div>
                <div className="kr-name">{c.name}</div>
                <div className="kr-code">{c.code}</div>
              </div>
              <span className="kr-badge" style={{
                background: c.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.15)',
                color: c.is_active ? '#22c55e' : 'var(--text-muted)'
              }}>
                {c.is_active ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="kr-btn" onClick={() => handleToggle(c)}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                <Power size={12} /> {c.is_active ? 'NONAKTIFKAN' : 'AKTIFKAN'}
              </button>
              <button type="button" className="kr-btn" onClick={() => openEdit(c)}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                <Pencil size={12} /> EDIT
              </button>
              <button type="button" className="kr-btn" onClick={() => setDeleteTarget(c)}
                style={{ background: 'rgba(240,46,41,0.08)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}>
                <Trash2 size={12} /> HAPUS
              </button>
            </div>
          </div>
        ))}
      </div>

      {editTarget && (
        <div className="kr-overlay" onClick={() => setEditTarget(null)}>
          <form className="kr-modal" onClick={e => e.stopPropagation()} onSubmit={handleEditSave}>
            <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 16 }}>EDIT KURIR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Kode kurir</label>
                <input style={{ ...inputStyle, opacity: editTarget.code === 'cod' ? 0.6 : 1 }}
                  value={editForm.code} maxLength={30} required
                  disabled={editTarget.code === 'cod'}
                  onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} />
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  {editTarget.code === 'cod'
                    ? 'Kode COD dikunci karena dipakai untuk pengantaran owner (ongkir Rp 0).'
                    : 'Harus sama dengan kode kurir RajaOngkir (huruf kecil, tanpa spasi).'}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Nama tampilan</label>
                <input style={inputStyle} value={editForm.name} maxLength={60} required
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Urutan tampil</label>
                <input style={inputStyle} type="number" min="0" max="9999" step="1" value={editForm.sort_order}
                  onChange={e => setEditForm(f => ({ ...f, sort_order: e.target.value }))} />
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Angka kecil tampil lebih dulu di checkout.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" className="kr-btn" onClick={() => setEditTarget(null)}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                BATAL
              </button>
              <button type="submit" className="kr-btn" disabled={editSaving}
                style={{ background: 'var(--accent-red)', border: '1px solid var(--accent-red)', color: 'white', opacity: editSaving ? 0.6 : 1 }}>
                {editSaving ? 'MENYIMPAN...' : 'SIMPAN'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="kr-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="kr-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: 8 }}>HAPUS KURIR?</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 18 }}>
              Kurir <b>{deleteTarget.name}</b> akan dihapus dari daftar. Pesanan lama tetap aman.
              Kalau cuma ingin menyembunyikan sementara, pakai tombol NONAKTIFKAN.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="kr-btn" onClick={() => setDeleteTarget(null)}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                BATAL
              </button>
              <button type="button" className="kr-btn" onClick={handleDelete}
                style={{ background: 'var(--accent-red)', border: '1px solid var(--accent-red)', color: 'white' }}>
                YA, HAPUS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
