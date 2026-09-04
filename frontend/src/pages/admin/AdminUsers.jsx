import { useState, useEffect } from 'react'
import { Search, UserX, UserCheck, X } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

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

  const handleToggleStatus = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-status`)
      toast.success('Status user berhasil diubah!')
      fetchUsers()
    } catch { toast.error('Gagal mengubah status') }
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
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: '0.62rem', fontWeight: 800,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--accent-red)', marginBottom: 8
        }}>Kelola</div>
        <h1 style={{
          fontWeight: 900, fontSize: '1.8rem',
          letterSpacing: '-0.02em', textTransform: 'uppercase',
          color: 'var(--text-primary)'
        }}>MANAJEMEN USER</h1>
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
            <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{total}</span> user
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
              {['User', 'Email', 'No. HP', 'Preferensi', 'Status', 'Bergabung', 'Aksi'].map(h => (
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
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--accent-red), #A2120E)',
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
                <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {user.email}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {user.phone || '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {user.pref_gender && (
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em',
                        padding: '2px 7px',
                        background: 'rgba(139,92,246,0.08)',
                        color: '#8b5cf6', borderRadius: 'var(--radius-xs)',
                        display: 'inline-block', width: 'fit-content'
                      }}>{user.pref_gender}</span>
                    )}
                    {user.pref_aroma && (
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em',
                        padding: '2px 7px',
                        background: 'rgba(240,46,41,0.08)',
                        color: 'var(--accent-red)', borderRadius: 'var(--radius-xs)',
                        display: 'inline-block', width: 'fit-content'
                      }}>{user.pref_aroma}</span>
                    )}
                    {!user.pref_gender && !user.pref_aroma && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>-</span>
                    )}
                  </div>
                </td>
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
                <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {new Date(user.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleToggleStatus(user.user_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px',
                      background: user.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                      border: `1px solid ${user.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                      borderRadius: 'var(--radius-xs)',
                      color: user.is_active ? '#ef4444' : '#22c55e',
                      cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800,
                      letterSpacing: '0.08em', transition: 'all 0.15s ease'
                    }}>
                    {user.is_active
                      ? <><UserX size={11} /> NONAKTIFKAN</>
                      : <><UserCheck size={11} /> AKTIFKAN</>
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  )
}