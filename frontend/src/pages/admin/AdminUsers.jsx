import { useState, useEffect } from 'react'
import { Search, UserX, UserCheck, X, Plus, Edit, Eye, EyeOff } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null) // null = tambah, object = edit
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '', role: 'customer'
  })

  useEffect(() => { fetchUsers() }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      const res = await api.get(`/admin/users?${params}`)
      setUsers(res.data.users)
      setTotal(res.data.total)
      setTotalPages(Math.ceil(res.data.total / 10))
    } catch { toast.error('Gagal memuat users') }
    finally { setLoading(false) }
  }

  const openAddModal = () => {
    setEditUser(null)
    setForm({ full_name: '', email: '', password: '', phone: '', role: 'customer' })
    setShowPass(false)
    setShowModal(true)
  }

  const openEditModal = (user) => {
    setEditUser(user)
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '', // password dikosongkan, isi kalau mau ganti
      phone: user.phone || '',
      role: user.role || 'customer'
    })
    setShowPass(false)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editUser) {
        // UC-25: Edit akun
        const payload = {}
        if (form.full_name) payload.full_name = form.full_name
        if (form.email) payload.email = form.email
        if (form.phone !== undefined) payload.phone = form.phone
        if (form.role) payload.role = form.role
        if (form.password) payload.password = form.password

        await api.put(`/admin/users/${editUser.user_id}`, payload)
        toast.success('Akun berhasil diupdate!')
      } else {
        // UC-24: Tambah akun
        await api.post('/admin/users', form)
        toast.success('Akun berhasil dibuat!')
      }
      setShowModal(false)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      await api.put(`/admin/users/${toggleTarget.user_id}/toggle-status`)
      toast.success(`User berhasil ${toggleTarget.is_active ? 'dinonaktifkan' : 'diaktifkan'}!`)
      setToggleTarget(null)
      fetchUsers()
    } catch { toast.error('Gagal mengubah status') }
    finally { setToggling(false) }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
    outline: 'none', fontFamily: 'var(--font-sans)',
    fontWeight: 500, transition: 'border-color 0.2s ease'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.6rem', fontWeight: 800,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 6
  }

  return (
    <div>
      <style>{`
        .users-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .users-search-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .users-h1 {
          font-weight: 900; font-size: 1.8rem;
          letter-spacing: -0.02em; text-transform: uppercase;
          color: var(--text-primary); margin: 0;
        }
        .users-add-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 20px;
          background: var(--accent-red); color: white;
          border-radius: var(--radius-sm); font-weight: 800;
          font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase;
          border: none; cursor: pointer;
          box-shadow: 0 4px 14px rgba(240,46,41,0.3);
        }
        .users-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .users-table-wrap table { min-width: 650px; }
        @media (max-width: 768px) {
          .users-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .users-h1 { font-size: 1.3rem !important; }
          .users-add-btn { width: 100% !important; justify-content: center !important; }
          .users-search-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .users-search-row > div:first-child {
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="users-header">
        <div>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 8
          }}>Kelola</div>
          <h1 className="users-h1">MANAJEMEN USER</h1>
        </div>
        <button onClick={openAddModal} className="users-add-btn">
          <Plus size={14} /> TAMBAH AKUN
        </button>
      </div>

      {/* Search + Total */}
      <div className="users-search-row">
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
          <input type="text" placeholder="Cari nama atau email..."
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
          <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{total}</span> user
        </div>
      </div>

      {/* Table */}
      <div className="users-table-wrap" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {['User', 'Email', 'No. HP', 'Role', 'Status', 'Bergabung', 'Aksi'].map(h => (
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
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>MEMUAT...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>TIDAK ADA USER</td></tr>
            ) : users.map(user => (
              <tr key={user.user_id} style={{
                borderTop: '1px solid var(--border-default)',
                transition: 'background 0.15s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* User */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: user.role === 'admin'
                        ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                        : 'linear-gradient(135deg, var(--accent-red), #A2120E)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.68rem', fontWeight: 800, color: 'white'
                    }}>
                      {getInitials(user.full_name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.full_name}</div>
                      {user.username && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--accent-red)', fontWeight: 600 }}>
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {user.email}
                </td>

                {/* HP */}
                <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {user.phone || '—'}
                </td>

                {/* Role */}
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-xs)',
                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                    background: user.role === 'admin' ? 'rgba(124,58,237,0.08)' : 'rgba(240,46,41,0.08)',
                    color: user.role === 'admin' ? '#7c3aed' : 'var(--accent-red)',
                    border: `1px solid ${user.role === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(240,46,41,0.2)'}`
                  }}>
                    {user.role.toUpperCase()}
                  </span>
                </td>

                {/* Status */}
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-xs)',
                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                    background: user.is_active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    color: user.is_active ? '#22c55e' : '#ef4444',
                    border: `1px solid ${user.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`
                  }}>
                    {user.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>

                {/* Bergabung */}
                <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {new Date(user.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </td>

                {/* Aksi */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Tombol Edit */}
                    <button onClick={() => openEditModal(user)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 'var(--radius-xs)',
                        color: '#3b82f6', cursor: 'pointer',
                        fontSize: '0.62rem', fontWeight: 800,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#3b82f6'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(59,130,246,0.08)'
                        e.currentTarget.style.color = '#3b82f6'
                      }}>
                      <Edit size={11} /> EDIT
                    </button>

                    {/* Tombol Toggle Status */}
                    <button
                      onClick={() => setToggleTarget(user)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px',
                        background: user.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                        border: `1px solid ${user.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                        borderRadius: 'var(--radius-xs)',
                        color: user.is_active ? '#ef4444' : '#22c55e',
                        cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = user.is_active ? '#ef4444' : '#22c55e'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = user.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)'
                        e.currentTarget.style.color = user.is_active ? '#ef4444' : '#22c55e'
                      }}>
                      {user.is_active
                        ? <><UserX size={11} /> NONAKTIF</>
                        : <><UserCheck size={11} /> AKTIFKAN</>
                      }
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

      {/* Modal Tambah/Edit Akun */}
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
            width: '100%', maxWidth: 460,
            padding: 32, animation: 'scaleIn 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24
            }}>
              <div>
                <div style={{
                  fontSize: '0.6rem', fontWeight: 800,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'var(--accent-red)', marginBottom: 4
                }}>
                  {editUser ? 'UC-25' : 'UC-24'}
                </div>
                <h2 style={{
                  fontWeight: 900, fontSize: '1rem',
                  textTransform: 'uppercase', letterSpacing: '-0.01em'
                }}>
                  {editUser ? 'EDIT AKUN' : 'TAMBAH AKUN BARU'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Nama */}
                <div>
                  <label style={labelStyle}>Nama Lengkap {!editUser && '*'}</label>
                  <input
                    type="text" value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Nama lengkap pengguna"
                    required={!editUser}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email {!editUser && '*'}</label>
                  <input
                    type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    required={!editUser}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>

                {/* No HP */}
                <div>
                  <label style={labelStyle}>No. HP</label>
                  <input
                    type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={labelStyle}>
                    Password {editUser
                      ? <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          (kosongkan jika tidak ingin mengubah)
                        </span>
                      : '*'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder={editUser ? 'Isi untuk mengganti password' : 'Min. 8 karakter'}
                      required={!editUser}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        background: 'none', border: 'none'
                      }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label style={labelStyle}>Role *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
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
                    boxShadow: saving ? 'none' : '0 4px 14px rgba(240,46,41,0.3)',
                    transition: 'all 0.2s ease'
                  }}>
                  {saving ? 'MENYIMPAN...' : editUser ? 'UPDATE AKUN' : 'BUAT AKUN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Toggle Status */}
      <ConfirmModal
        show={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        loading={toggling}
        title={toggleTarget?.is_active ? 'NONAKTIFKAN USER?' : 'AKTIFKAN USER?'}
        message={`User "${toggleTarget?.full_name}" akan ${toggleTarget?.is_active ? 'dinonaktifkan dan tidak bisa login' : 'diaktifkan kembali'}.`}
        confirmLabel={toggleTarget?.is_active ? 'YA, NONAKTIFKAN' : 'YA, AKTIFKAN'}
        confirmColor={toggleTarget?.is_active ? '#ef4444' : '#22c55e'}
      />
    </div>
  )
}