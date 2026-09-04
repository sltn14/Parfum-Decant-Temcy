import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Check, MapPin, X } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const LABELS = ['Rumah', 'Kantor', 'Kost', 'Lainnya']

export default function AddressPage() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editAddress, setEditAddress] = useState(null)
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    label: 'Rumah', recipient_name: '', phone: '',
    province: '', province_id: '', city: '', city_id: '',
    district: '', postal_code: '', detail: '', is_default: false
  })

  useEffect(() => {
    fetchAddresses()
    fetchProvinces()
  }, [])

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses')
      setAddresses(res.data.addresses)
    } catch { toast.error('Gagal memuat alamat') }
    finally { setLoading(false) }
  }

  const fetchProvinces = async () => {
    try {
      const res = await api.get('/shipping/provinces')
      setProvinces(res.data.provinces)
    } catch {}
  }

  const fetchCities = async (provinceId) => {
    try {
      const res = await api.get(`/shipping/cities/${provinceId}`)
      setCities(res.data.cities)
    } catch {}
  }

  const handleProvinceChange = (e) => {
    const selected = provinces.find(p => p.province_id === e.target.value)
    setForm(prev => ({
      ...prev,
      province_id: e.target.value,
      province: selected?.province || '',
      city: '', city_id: ''
    }))
    setCities([])
    if (e.target.value) fetchCities(e.target.value)
  }

  const handleCityChange = (e) => {
    const selected = cities.find(c => c.city_id === e.target.value)
    setForm(prev => ({
      ...prev,
      city_id: e.target.value,
      city: selected?.city_name || '',
      postal_code: selected?.postal_code || ''
    }))
  }

  const openModal = (address = null) => {
    if (address) {
      setEditAddress(address)
      setForm({
        label: address.label,
        recipient_name: address.recipient_name,
        phone: address.phone,
        province: address.province,
        province_id: address.province_id || '',
        city: address.city,
        city_id: address.city_id || '',
        district: address.district || '',
        postal_code: address.postal_code || '',
        detail: address.detail,
        is_default: address.is_default
      })
      if (address.province_id) fetchCities(address.province_id)
    } else {
      setEditAddress(null)
      setForm({
        label: 'Rumah', recipient_name: '', phone: '',
        province: '', province_id: '', city: '', city_id: '',
        district: '', postal_code: '', detail: '', is_default: false
      })
    }
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editAddress) {
        await api.put(`/addresses/${editAddress.address_id}`, form)
        toast.success('Alamat diupdate!')
      } else {
        await api.post('/addresses', form)
        toast.success('Alamat ditambahkan!')
      }
      setShowModal(false)
      fetchAddresses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus alamat ini?')) return
    try {
      await api.delete(`/addresses/${id}`)
      toast.success('Alamat dihapus')
      fetchAddresses()
    } catch { toast.error('Gagal menghapus') }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/set-default`)
      fetchAddresses()
      toast.success('Alamat default diubah')
    } catch { toast.error('Gagal') }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
    outline: 'none', fontFamily: 'var(--font-sans)',
    fontWeight: 500, transition: 'border-color 0.2s ease'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.6rem', fontWeight: 800,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 6
  }

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 40
        }}>
          <div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--accent-red)', marginBottom: 10
            }}>Pengiriman</div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase'
            }}>ALAMAT SAYA</h1>
          </div>
          <button onClick={() => openModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px',
              background: 'var(--accent-red)', color: 'white',
              fontWeight: 800, fontSize: '0.72rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(240,46,41,0.3)',
              transition: 'all 0.2s ease'
            }}>
            <Plus size={14} /> TAMBAH ALAMAT
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2].map(i => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <MapPin size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{
              fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '-0.02em', marginBottom: 10
            }}>BELUM ADA ALAMAT</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>
              Tambahkan alamat pengiriman kamu
            </p>
            <button onClick={() => openModal()}
              style={{
                padding: '12px 28px',
                background: 'var(--accent-red)', color: 'white',
                borderRadius: 'var(--radius-sm)', fontWeight: 800,
                fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer'
              }}>
              TAMBAH ALAMAT BARU
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {addresses.map((addr, i) => (
              <div key={addr.address_id} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${addr.is_default ? 'rgba(240,46,41,0.3)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)', padding: '20px 24px',
                position: 'relative', animation: `fadeInUp 0.4s ease ${i * 0.06}s both`
              }}>
                {addr.is_default && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    padding: '3px 10px',
                    background: 'rgba(240,46,41,0.1)',
                    border: '1px solid rgba(240,46,41,0.2)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.58rem', fontWeight: 800,
                    letterSpacing: '0.15em', color: 'var(--accent-red)'
                  }}>DEFAULT</div>
                )}

                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    padding: '4px 10px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.62rem', fontWeight: 800,
                    letterSpacing: '0.1em', color: 'var(--text-muted)'
                  }}>{addr.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{addr.recipient_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                    {addr.phone}
                  </div>
                </div>

                <p style={{
                  color: 'var(--text-secondary)', fontSize: '0.85rem',
                  lineHeight: 1.7, marginBottom: 16, fontWeight: 400
                }}>
                  {addr.detail}, {addr.district && `${addr.district}, `}{addr.city}, {addr.province}
                  {addr.postal_code && ` ${addr.postal_code}`}
                </p>

                <div style={{ display: 'flex', gap: 10 }}>
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr.address_id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)', fontWeight: 700,
                        fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent-red)'
                        e.currentTarget.style.color = 'var(--accent-red)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-default)'
                        e.currentTarget.style.color = 'var(--text-muted)'
                      }}>
                      <Check size={12} /> SET DEFAULT
                    </button>
                  )}
                  <button onClick={() => openModal(addr)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)', fontWeight: 700,
                      fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.color = '#3b82f6'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-default)'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }}>
                    <Edit size={12} /> EDIT
                  </button>
                  <button onClick={() => handleDelete(addr.address_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#ef4444', fontWeight: 700,
                      fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ef4444'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                      e.currentTarget.style.color = '#ef4444'
                    }}>
                    <Trash2 size={12} /> HAPUS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
            width: '100%', maxWidth: 600,
            maxHeight: '90vh', overflow: 'auto',
            padding: 36, animation: 'scaleIn 0.25s ease'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 28
            }}>
              <h2 style={{
                fontWeight: 900, fontSize: '1rem',
                letterSpacing: '-0.01em', textTransform: 'uppercase'
              }}>
                {editAddress ? 'EDIT ALAMAT' : 'TAMBAH ALAMAT BARU'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Label */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Label Alamat</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {LABELS.map(l => (
                    <button key={l} type="button"
                      onClick={() => setForm(prev => ({ ...prev, label: l }))}
                      style={{
                        flex: 1, padding: '9px',
                        background: form.label === l ? 'var(--accent-red)' : 'var(--bg-elevated)',
                        border: `1px solid ${form.label === l ? 'var(--accent-red)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: form.label === l ? 'white' : 'var(--text-secondary)',
                        fontWeight: 800, cursor: 'pointer',
                        fontSize: '0.62rem', letterSpacing: '0.08em',
                        transition: 'all 0.15s ease'
                      }}>{l}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Nama Penerima</label>
                  <input type="text" value={form.recipient_name}
                    onChange={e => setForm(prev => ({ ...prev, recipient_name: e.target.value }))}
                    placeholder="Nama lengkap" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>No. HP</label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Provinsi</label>
                  <select value={form.province_id} onChange={handleProvinceChange} required
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Pilih Provinsi</option>
                    {provinces.map(p => (
                      <option key={p.province_id} value={p.province_id}>{p.province}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Kota/Kabupaten</label>
                  <select value={form.city_id} onChange={handleCityChange} required
                    disabled={!form.province_id}
                    style={{ ...inputStyle, appearance: 'none', cursor: form.province_id ? 'pointer' : 'not-allowed', opacity: form.province_id ? 1 : 0.5 }}>
                    <option value="">Pilih Kota</option>
                    {cities.map(c => (
                      <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Kecamatan <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span></label>
                  <input type="text" value={form.district}
                    onChange={e => setForm(prev => ({ ...prev, district: e.target.value }))}
                    placeholder="Nama kecamatan" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Kode Pos</label>
                  <input type="text" value={form.postal_code}
                    onChange={e => setForm(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="12345" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Alamat Detail</label>
                <textarea value={form.detail}
                  onChange={e => setForm(prev => ({ ...prev, detail: e.target.value }))}
                  placeholder="Nama jalan, nomor rumah, RT/RW, nama gedung, lantai, dll"
                  required rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>

              {/* Default checkbox */}
              <div style={{ marginBottom: 28 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer'
                }}>
                  <div
                    onClick={() => setForm(prev => ({ ...prev, is_default: !prev.is_default }))}
                    style={{
                      width: 18, height: 18, borderRadius: 4,
                      background: form.is_default ? 'var(--accent-red)' : 'var(--bg-elevated)',
                      border: `1px solid ${form.is_default ? 'var(--accent-red)' : 'var(--border-default)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0
                    }}>
                    {form.is_default && <Check size={11} style={{ color: 'white' }} />}
                  </div>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)'
                  }}>Jadikan sebagai alamat utama</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '13px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)', fontWeight: 800,
                    fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}>BATAL</button>
                <button type="submit" disabled={saving}
                  style={{
                    flex: 2, padding: '13px',
                    background: saving ? 'var(--border-hover)' : 'var(--accent-red)',
                    color: 'white', fontWeight: 800,
                    fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                    borderRadius: 'var(--radius-sm)', border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving ? 'none' : '0 4px 16px rgba(240,46,41,0.3)',
                    transition: 'all 0.2s ease'
                  }}>
                  {saving ? 'MENYIMPAN...' : editAddress ? 'UPDATE ALAMAT' : 'SIMPAN ALAMAT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}