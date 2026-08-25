import { useState, useEffect } from 'react'
import { Search, UserX, UserCheck } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      const res = await api.get(`/admin/users?${params}`)
      setUsers(res.data.users)
      setTotal(res.data.total)
      setTotalPages(Math.ceil(res.data.total / 10))
    } catch {
      toast.error('Gagal memuat users')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-status`)
      toast.success('Status user berhasil diubah!')
      fetchUsers()
    } catch {
      toast.error('Gagal mengubah status user')
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)'
        }}>
          Manajemen User
        </h1>
        <div style={{
          padding: '6px 14px',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600
        }}>
          Total: {total} user
        </div>
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
          type="text" placeholder="Cari nama atau email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{
            flex: 1, background: 'none', border: 'none',
            outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem'
          }}
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
              {['User', 'Email', 'No. HP', 'Preferensi', 'Status', 'Bergabung', 'Aksi'].map(h => (
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Tidak ada user
                </td>
              </tr>
            ) : (
              users.map((user, i) => (
                <tr key={user.user_id} style={{
                  borderTop: '1px solid var(--border-default)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                }}>
                  {/* User */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--accent-red)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.78rem', fontWeight: 700, color: 'white', flexShrink: 0
                      }}>
                        {getInitials(user.full_name)}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                        {user.full_name}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {user.email}
                  </td>

                  {/* Phone */}
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {user.phone || '-'}
                  </td>

                  {/* Preferensi */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {user.pref_gender && (
                        <span style={{
                          fontSize: '0.72rem', padding: '2px 8px',
                          background: 'rgba(139,92,246,0.1)',
                          color: '#8b5cf6', borderRadius: 'var(--radius-full)',
                          display: 'inline-block', width: 'fit-content'
                        }}>
                          {user.pref_gender}
                        </span>
                      )}
                      {user.pref_aroma && (
                        <span style={{
                          fontSize: '0.72rem', padding: '2px 8px',
                          background: 'rgba(185,28,28,0.1)',
                          color: 'var(--accent-red)', borderRadius: 'var(--radius-full)',
                          display: 'inline-block', width: 'fit-content'
                        }}>
                          {user.pref_aroma}
                        </span>
                      )}
                      {!user.pref_gender && !user.pref_aroma && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem', fontWeight: 600,
                      background: user.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: user.is_active ? '#22c55e' : '#ef4444'
                    }}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>

                  {/* Bergabung */}
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleToggleStatus(user.user_id)}
                      style={{
                        padding: '6px 12px',
                        background: user.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                        border: `1px solid ${user.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: user.is_active ? '#ef4444' : '#22c55e',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: '0.8rem', fontWeight: 600
                      }}>
                      {user.is_active
                        ? <><UserX size={13} /> Nonaktifkan</>
                        : <><UserCheck size={13} /> Aktifkan</>
                      }
                    </button>
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
    </div>
  )
}