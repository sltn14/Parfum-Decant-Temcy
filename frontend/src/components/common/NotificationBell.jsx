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

  useEffect(() => {
    if (isAuthenticated) fetchNotifications()
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
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.notifications.filter(n => !n.is_read).length)
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
    setOpen(prev => !prev)
    if (!open && unreadCount > 0) handleMarkAllRead()
  }

  const TYPE_CONFIG = {
    order: { icon: '📦', color: '#3b82f6' },
    promo: { icon: '🎁', color: '#f59e0b' },
    system: { icon: '🔔', color: '#8b5cf6' }
  }

  if (!isAuthenticated) return null

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button onClick={handleOpen}
        style={{ position: 'relative', color: 'var(--text-secondary)', cursor: 'pointer' }}>
        <Bell size={22} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--accent-red)', color: 'white',
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          width: 340,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden', zIndex: 200
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifikasi</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                style={{
                  fontSize: '0.75rem', color: 'var(--accent-red)',
                  cursor: 'pointer', fontWeight: 600
                }}>
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: 32, textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.88rem'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</div>
                Belum ada notifikasi
              </div>
            ) : (
              notifications.map(notif => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
                return (
                  <div key={notif.notification_id} style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-default)',
                    background: notif.is_read ? 'transparent' : 'rgba(185,28,28,0.05)',
                    display: 'flex', gap: 12, alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: `${config.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem'
                    }}>
                      {config.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--accent-red)', flexShrink: 0, marginTop: 4
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