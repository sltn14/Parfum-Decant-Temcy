import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, CheckCheck } from 'lucide-react'
import { io } from 'socket.io-client'
import api from '../../api/axios'
import { API_URL } from '../../config/env'
import useAuthStore from '../../store/authStore'

export default function NotificationBell({ mobile = false }) {
  const { isAuthenticated, user } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const openRef = useRef(false)

  useEffect(() => {
    openRef.current = open
  }, [open])

  // Setup Socket.io. Server memverifikasi token JWT saat handshake dan
  // otomatis memasukkan klien ke room miliknya (klien tidak mengirim user_id).
  useEffect(() => {
    if (!isAuthenticated || !user?.user_id) return

    const socket = io(API_URL, {
      withCredentials: true,
      auth: { token: useAuthStore.getState().token }
    })

    // Notifikasi baru selalu masuk sebagai belum dibaca; pengguna yang menandainya sendiri
    socket.on('notification', (notif) => {
      setNotifications(prev => [{ ...notif, is_read: false }, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated, user?.user_id])

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
    if (next) fetchNotifications() // segarkan daftar; tidak otomatis ditandai dibaca
  }

  // Klik notifikasi: tandai dibaca, tutup dropdown, buka halaman terkait
  const handleNotifClick = async (notif) => {
    if (!notif.is_read && notif.notification_id) {
      setNotifications(prev => prev.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      api.put(`/notifications/${notif.notification_id}/read`).catch(() => {})
    }
    // Notifikasi lama tanpa link: pesanan -> daftar pesanan
    const target = notif.link || (notif.type === 'order' ? '/orders' : null)
    if (target) {
      setOpen(false)
      navigate(target)
    }
  }

  const hasTarget = (n) => !!(n.link || n.type === 'order')

  const TYPE_CONFIG = {
    order: { icon: '📦', color: '#3b82f6' },
    promo: { icon: '🎁', color: '#f59e0b' },
    system: { icon: '🔔', color: '#8b5cf6' }
  }

  if (!isAuthenticated) return null

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
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
        }}>
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 15, height: 15, borderRadius: '50%',
            background: 'var(--accent-red)', color: 'white',
            fontSize: '0.55rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, animation: 'pulse-glow-sm 2s infinite'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          ...(mobile
            // Di bilah ikon mobile, lonceng tidak di tepi kanan: tempel ke lebar layar
            ? { position: 'fixed', top: 64, left: 16, right: 16 }
            : { position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 'min(340px, calc(100vw - 32px))' }),
          background: 'var(--glass-panel)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          overflow: 'hidden', zIndex: 200,
          animation: 'fadeInDown 0.2s ease'
        }}>
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
                  letterSpacing: '0.04em',
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                <CheckCheck size={13} /> Tandai semua dibaca
              </button>
            )}
          </div>

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
                  <div key={notif.notification_id || i}
                    role="button" tabIndex={0}
                    onClick={() => handleNotifClick(notif)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNotifClick(notif) }}
                    style={{
                    cursor: 'pointer',
                    padding: '14px 18px',
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--border-default)' : 'none',
                    background: notif.is_read ? 'transparent' : 'rgba(240,46,41,0.04)',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    transition: 'background 0.15s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-tint)'}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(240,46,41,0.04)'
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: config.color + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.95rem'
                    }}>
                      {config.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 3, lineHeight: 1.3 }}>
                        {notif.title}
                      </div>
                      <div style={{
                        fontSize: '0.75rem', color: 'var(--text-muted)',
                        lineHeight: 1.5, fontWeight: 400, marginBottom: 4
                      }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                        {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, marginTop: 5 }}>
                      {!notif.is_read && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-red)' }} />
                      )}
                      {hasTarget(notif) && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                    </div>
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