import { useState, useEffect } from 'react'
import { Search, X, Plus, Edit, Eye, EyeOff, Key, Shield, UserX, UserCheck } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function SysAdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Modal tambah/edit
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '', role: 'customer'
  })

  // Modal reset password
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [showResetPass, setShowResetPass] = useState(false)
  const [showSysPass, setShowSysPass] = useState(false)
  const [resetForm, setResetForm] = useState({ new_password: '', sysadmin_password: '' })

  // Modal toggle status (perlu re-auth)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showToggleSysPass, setShowToggleSysPass] = useState(false)
  const [toggleSysPass, setToggleSysPass] = useState('')

  // Modal set role (perlu re-auth)
  const [roleTarget, setRoleTarget] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [settingRole, setSettingRole] = useState(false)
  const [showRoleSysPass, setShowRoleSysPass] = useState(false)
  const [roleForm, setRoleForm] = useState({ role: 'customer', sysadmin_password: '' })

  useEffect(() => { fetchUsers() }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      const res = await api.get(`/sysadmin/users?${params}`)
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
      password: '',
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
        const payload = {}
        if (form.full_name) payload.full_name = form.full_name
        if (form.email) payload.email = form.email
        if (form.phone !== undefined) payload.phone = form.phone
        if (form.role) payload.role = form.role
        if (form.password) payload.password = form.password
        await api.put(`/sysadmin/users/${editUser.user_id}`, payload)
        toast.success('Akun berhasil diupdate!')
      } else {
        await api.post('/sysadmin/users', form)
        toast.success('Akun berhasil dibuat!')
      }
      setShowModal(false)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setResetting(true)
    try {
      await api.put(`/sysadmin/users/${resetTarget.user_id}/reset-password`, resetForm)
      toast.success(`Password ${resetTarget.full_name} berhasil direset!`)
      setShowResetModal(false)
      setResetForm({ new_password: '', sysadmin_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal reset password')
    } finally { setResetting(false) }
  }

  const handleToggleStatus = async (e) => {
    e.preventDefault()
    setToggling(true)
    try {
      await api.put(`/sysadmin/users/${toggleTarget.user_id}/toggle-status`, {
        sysadmin_password: toggleSysPass
      })
      toast.success(`User berhasil ${toggleTarget.is_active ? 'dinonaktifkan' : 'diaktifkan'}!`)
      setShowToggleModal(false)
      setToggleSysPass('')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status')
    } finally { setToggling(false) }
  }

  const handleSetRole = async (e) => {
    e.preventDefault()
    setSettingRole(true)
    try {
      await api.put(`/sysadmin/users/${roleTarget.user_id}/set-role`, roleForm)
      toast.success(`Role ${roleTarget.full_name} berhasil diubah!`)
      setShowRoleModal(false)
      setRoleForm({ role: 'customer', sysadmin_password: '' })
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah role')
    } finally { setSettingRole(false) }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
  }

  const getRoleColor = (role) => {
    if (role === 'sysadmin') return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' }
    if (role === 'admin') return { color: 'var(--accent-red)', bg: 'rgba(240,46,41,0.08)', border: 'rgba(240,46,41,0.2)' }
    return { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' }
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

  const modalOverlay = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, backdropFilter: 'blur(8px)'
  }

  const modalBox = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    width: '100%', maxWidth: 460,
    padding: 32, animation: 'scaleIn 0.2s ease'
  }

  return (
    <div>
      <style>{`
        .sysusers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .sysusers-h1 { font-weight: 900; font-size: 1.8rem; letter-spacing: -0.02em; text-transform: uppercase; margin: 0; }
        .sysusers-add-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 20px; background: #8b5cf6; color: white;
          border-radius: var(--radius-sm); font-weight: 800;
          font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase;
          border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(139,92,246,0.3);
        }
        .sysusers-search-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .sysusers-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .sysusers-table-wrap table { min-width: 700px; }
        @media (max-width: 768px) {
          .sysusers-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; margin-bottom: 20px !important; }
          .sysusers-h1 { font-size: 1.3rem !important; }
          .sysusers-add-btn { width: 100% !important; justify-content: center !important; }
          .sysusers-search-row { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
          .sysusers-search-row > div:first-child { max-width: 100% !important; }
          .sysusers-modal-overlay { padding: 0 !important; align-items: flex-end !important; }
          .sysusers-modal-box {
            max-width: 100% !important; padding: 20px !important;
            max-height: 92vh; overflow-y: auto;
            border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="sysusers-header">
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.62rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#8b5cf6', marginBottom: 8
          }}>
            <Shield size={12} /> Administrator Sistem
          </div>
          <h1 className="sysusers-h1">MANAJEMEN AKUN</h1>
        </div>
        <button onClick={openAddModal} className="sysusers-add-btn">
          <Plus size={14} /> TAMBAH AKUN
        </button>
      </div>

      {/* Search */}
      <div className="sysusers-search-row">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px', maxWidth: 360, flex: 1
        }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Cari nama atau email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{total}</span> akun
        </div>
      </div>

      {/* Table */}
      <div className="sysusers-table-wrap" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {['Akun', 'Email', 'No. HP', 'Role', 'Status', 'Bergabung', 'Aksi'].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left',
                  fontSize: '0.58rem', fontWeight: 800,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>MEMUAT...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>TIDAK ADA AKUN</td></tr>
            ) : users.map(user => {
              const roleStyle = getRoleColor(user.role)
              return (
                <tr key={user.user_id} style={{
                  borderTop: '1px solid var(--border-default)',
                  transition: 'background 0.15s ease'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: user.role === 'sysadmin'
                          ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                          : user.role === 'admin'
                          ? 'linear-gradient(135deg, var(--accent-red), #A2120E)'
                          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.68rem', fontWeight: 800, color: 'white'
                      }}>
                        {getInitials(user.full_name)}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.full_name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{user.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{user.phone || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 'var(--radius-xs)',
                      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                      background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`
                    }}>{user.role.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 'var(--radius-xs)',
                      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                      background: user.is_active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      color: user.is_active ? '#22c55e' : '#ef4444',
                      border: `1px solid ${user.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`
                    }}>{user.is_active ? 'AKTIF' : 'NONAKTIF'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {/* Edit */}
                      <button onClick={() => openEditModal(user)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
                          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                          borderRadius: 'var(--radius-xs)', color: '#3b82f6',
                          cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800, transition: 'all 0.15s ease'
                        }}>
                        <Edit size={10} /> EDIT
                      </button>
                      {/* Reset Password */}
                      <button onClick={() => { setResetTarget(user); setShowResetModal(true) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
                          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                          borderRadius: 'var(--radius-xs)', color: '#f59e0b',
                          cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800, transition: 'all 0.15s ease'
                        }}>
                        <Key size={10} /> RESET PW
                      </button>
                      {/* Set Role */}
                      <button onClick={() => {
                        setRoleTarget(user)
                        setRoleForm({ role: user.role, sysadmin_password: '' })
                        setShowRoleModal(true)
                      }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
                          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                          borderRadius: 'var(--radius-xs)', color: '#8b5cf6',
                          cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800, transition: 'all 0.15s ease'
                        }}>
                        <Shield size={10} /> ROLE
                      </button>
                      {/* Toggle Status */}
                      <button onClick={() => { setToggleTarget(user); setShowToggleModal(true); setToggleSysPass('') }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
                          background: user.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                          border: `1px solid ${user.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                          borderRadius: 'var(--radius-xs)',
                          color: user.is_active ? '#ef4444' : '#22c55e',
                          cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800, transition: 'all 0.15s ease'
                        }}>
                        {user.is_active ? <><UserX size={10} /> NONAKTIF</> : <><UserCheck size={10} /> AKTIFKAN</>}
                      </button>
                    </div>
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
            style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>← PREV</button>
          <span style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>NEXT →</button>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="sysusers-modal-overlay" style={modalOverlay}>
          <div className="sysusers-modal-box" style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>
                {editUser ? 'EDIT AKUN' : 'TAMBAH AKUN BARU'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Nama Lengkap</label>
                  <input type="text" value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    required={!editUser} placeholder="Nama lengkap" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required={!editUser} placeholder="email@example.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>No. HP</label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Password {editUser && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(kosongkan jika tidak ingin mengubah)</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required={!editUser} placeholder={editUser ? 'Isi untuk mengganti' : 'Min. 8 karakter'}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin Toko</option>
                    <option value="sysadmin">Administrator Sistem</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  BATAL
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', background: saving ? 'var(--border-hover)' : '#8b5cf6', color: 'white', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 'var(--radius-sm)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}>
                  {saving ? 'MENYIMPAN...' : editUser ? 'UPDATE AKUN' : 'BUAT AKUN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && (
        <div className="sysusers-modal-overlay" style={modalOverlay}>
          <div className="sysusers-modal-box" style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>
                RESET PASSWORD
              </h2>
              <button onClick={() => setShowResetModal(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '10px 14px', marginBottom: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
              Reset password untuk: <strong>{resetTarget?.full_name}</strong> ({resetTarget?.email})
            </div>
            <form onSubmit={handleResetPassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Password Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showResetPass ? 'text' : 'password'} value={resetForm.new_password}
                      onChange={e => setResetForm(prev => ({ ...prev, new_password: e.target.value }))}
                      required placeholder="Min. 8 karakter"
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                    />
                    <button type="button" onClick={() => setShowResetPass(!showResetPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                      {showResetPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Password Administrator Sistem (Re-autentikasi)</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showSysPass ? 'text' : 'password'} value={resetForm.sysadmin_password}
                      onChange={e => setResetForm(prev => ({ ...prev, sysadmin_password: e.target.value }))}
                      required placeholder="Password akun sysadmin Anda"
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                    />
                    <button type="button" onClick={() => setShowSysPass(!showSysPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                      {showSysPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowResetModal(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  BATAL
                </button>
                <button type="submit" disabled={resetting}
                  style={{ flex: 2, padding: '12px', background: resetting ? 'var(--border-hover)' : '#f59e0b', color: 'white', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 'var(--radius-sm)', border: 'none', cursor: resetting ? 'not-allowed' : 'pointer' }}>
                  {resetting ? 'MERESET...' : 'RESET PASSWORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Toggle Status (Re-auth) */}
      {showToggleModal && (
        <div className="sysusers-modal-overlay" style={modalOverlay}>
          <div className="sysusers-modal-box" style={{ ...modalBox, maxWidth: 400, textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: toggleTarget?.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '1.4rem',
              color: toggleTarget?.is_active ? '#ef4444' : '#22c55e', fontWeight: 900
            }}>!</div>
            <h3 style={{ fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: 8 }}>
              {toggleTarget?.is_active ? 'NONAKTIFKAN AKUN?' : 'AKTIFKAN AKUN?'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 20, fontWeight: 400 }}>
              Akun <strong style={{ color: 'var(--text-primary)' }}>{toggleTarget?.full_name}</strong> akan {toggleTarget?.is_active ? 'dinonaktifkan' : 'diaktifkan'}.
              Masukkan password Administrator Sistem untuk konfirmasi.
            </p>
            <form onSubmit={handleToggleStatus}>
              <div style={{ marginBottom: 20, textAlign: 'left' }}>
                <label style={labelStyle}>Password Administrator Sistem</label>
                <div style={{ position: 'relative' }}>
                  <input type={showToggleSysPass ? 'text' : 'password'} value={toggleSysPass}
                    onChange={e => setToggleSysPass(e.target.value)}
                    required placeholder="Password akun sysadmin Anda"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                  <button type="button" onClick={() => setShowToggleSysPass(!showToggleSysPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                    {showToggleSysPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowToggleModal(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  BATAL
                </button>
                <button type="submit" disabled={toggling}
                  style={{ flex: 1, padding: '12px', background: toggling ? 'var(--border-hover)' : (toggleTarget?.is_active ? '#ef4444' : '#22c55e'), color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: toggling ? 'not-allowed' : 'pointer' }}>
                  {toggling ? 'MEMPROSES...' : 'KONFIRMASI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Set Role (Re-auth) */}
      {showRoleModal && (
        <div className="sysusers-modal-overlay" style={modalOverlay}>
          <div className="sysusers-modal-box" style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>UBAH ROLE</h2>
              <button onClick={() => setShowRoleModal(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '10px 14px', marginBottom: 20, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#8b5cf6', fontWeight: 600 }}>
              Mengubah role: <strong>{roleTarget?.full_name}</strong> (saat ini: {roleTarget?.role})
            </div>
            <form onSubmit={handleSetRole}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Role Baru</label>
                  <select value={roleForm.role} onChange={e => setRoleForm(prev => ({ ...prev, role: e.target.value }))}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin Toko</option>
                    <option value="sysadmin">Administrator Sistem</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Password Administrator Sistem (Re-autentikasi)</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showRoleSysPass ? 'text' : 'password'} value={roleForm.sysadmin_password}
                      onChange={e => setRoleForm(prev => ({ ...prev, sysadmin_password: e.target.value }))}
                      required placeholder="Password akun sysadmin Anda"
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                    />
                    <button type="button" onClick={() => setShowRoleSysPass(!showRoleSysPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                      {showRoleSysPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowRoleModal(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  BATAL
                </button>
                <button type="submit" disabled={settingRole}
                  style={{ flex: 2, padding: '12px', background: settingRole ? 'var(--border-hover)' : '#8b5cf6', color: 'white', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 'var(--radius-sm)', border: 'none', cursor: settingRole ? 'not-allowed' : 'pointer' }}>
                  {settingRole ? 'MENYIMPAN...' : 'UBAH ROLE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}