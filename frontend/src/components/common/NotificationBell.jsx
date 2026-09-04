import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const openRef = useRef(false)

  useEffect(() => {
    if (isAuthenticated) return

    fetchNotifications()

    const interval = setInterval(() => {
      if (!open) fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications || [])
      setUnreadCount((res.data.notifications || []).filter(n => !n.is_read).length)
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  const handleOpen = () => {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) handleMarkAllRead()
  }

  const TYPE_CONFIG = {
    order: { icon: '📦', color: '#3b82f6' },
    promo: { icon: '🎁', color: '#f59e0b' },
    system: { icon: '🔔', color: '#8b5cf6' }
  }

  if (!isAuthenticated) return null

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button — sama ukuran dengan Search & Cart */}
      <button
        onClick={handleOpen}
        style={{
          width: 38, height: 38, borderRadius: 'var(--radius-full)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? 'var(--text-primary)' : 'var(--text-muted)',
          background: open ? 'rgba(240,46,41,0.1)' : 'transparent',
          border: 'none', cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative', flexShrink: 0
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = open ? 'var(--text-primary)' : 'var(--text-muted)'
          e.currentTarget.style.background = open ? 'rgba(240,46,41,0.1)' : 'transparent'
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 15, height: 15, borderRadius: '50%',
            background: 'var(--accent-red)', color: 'white',
            fontSize: '0.55rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 340,
          background: 'rgba(13,13,20,0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          overflow: 'hidden', zIndex: 200,
          animation: 'fadeInDown 0.2s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(240,46,41,0.06), transparent)'
          }}>
            <div style={{
              fontWeight: 800, fontSize: '0.82rem',
              letterSpacing: '0.06em', textTransform: 'uppercase'
            }}>NOTIFIKASI</div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                style={{
                  fontSize: '0.68rem', color: 'var(--accent-red)',
                  cursor: 'pointer', fontWeight: 700,
                  background: 'none', border: 'none',
                  letterSpacing: '0.04em'
                }}>
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '36px 24px', textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <Bell size={28} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Belum ada notifikasi
                </div>
              </div>
            ) : (
              notifications.map((notif, i) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
                return (
                  <div key={notif.notification_id} style={{
                    padding: '14px 18px',
                    borderBottom: i < notifications.length - 1
                      ? '1px solid var(--border-default)'
                      : 'none',
                    background: notif.is_read
                      ? 'transparent'
                      : 'rgba(240,46,41,0.04)',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    transition: 'background 0.15s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = notif.is_read
                        ? 'transparent'
                        : 'rgba(240,46,41,0.04)'
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: config.color + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.95rem'
                    }}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: '0.82rem',
                        marginBottom: 3, lineHeight: 1.3
                      }}>
                        {notif.title}
                      </div>
                      <div style={{
                        fontSize: '0.75rem', color: 'var(--text-muted)',
                        lineHeight: 1.5, fontWeight: 400,
                        marginBottom: 4
                      }}>
                        {notif.message}
                      </div>
                      <div style={{
                        fontSize: '0.65rem', color: 'var(--text-muted)',
                        fontWeight: 600, letterSpacing: '0.04em'
                      }}>
                        {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!notif.is_read && (
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--accent-red)',
                        flexShrink: 0, marginTop: 5
                      }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}