import { useState, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useResponsiveTables, RESPONSIVE_TABLE_CSS } from './responsiveTables'
import { Toaster } from 'react-hot-toast'
import { LayoutDashboard, Users, Settings, Activity, LogOut, Shield, Menu, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../api/axios'

const navLinks = [
  { to: '/sysadmin', icon: <LayoutDashboard size={16} />, label: 'DASHBOARD', exact: true },
  { to: '/sysadmin/users', icon: <Users size={16} />, label: 'MANAJEMEN AKUN' },
  { to: '/sysadmin/config', icon: <Settings size={16} />, label: 'KONFIGURASI' },
  { to: '/sysadmin/monitoring', icon: <Activity size={16} />, label: 'MONITORING' },
]

export default function SysAdminLayout() {
  const { user, clearAuth } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef(null)
  useResponsiveTables(mainRef)

  const isActive = (to, exact = false) => {
    if (exact) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  const handleLogout = async () => {
    sessionStorage.setItem('logging-out', 'true')
    clearAuth()
    try { await api.post('/auth/logout') } catch {}
    sessionStorage.removeItem('logging-out')
    window.location.href = '/'
  }

  const getInitials = (name) => {
    if (!name) return 'SA'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-default)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
          onClick={() => setSidebarOpen(false)}>
          <div style={{ width: 32, height: 32, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="DT" style={{ width: 100, height: 100, filter: 'brightness(0) invert(1)', transform: 'scale(2.2)', objectFit: 'contain' }} />
          </div>
          <div style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.2 }}>
            <span style={{ color: 'var(--text-primary)' }}>DECANT </span>
            <span style={{ color: 'var(--accent-red)' }}>TEMCY</span>
          </div>
        </Link>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8b5cf6' }}>
          <Shield size={11} /> ADMINISTRATOR SISTEM
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navLinks.map(({ to, icon, label, exact }) => {
          const active = isActive(to, exact)
          return (
            <Link key={to} to={to} onClick={() => setSidebarOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 20px',
              color: active ? '#8b5cf6' : 'var(--text-muted)',
              background: active ? 'rgba(139,92,246,0.08)' : 'transparent',
              borderLeft: `3px solid ${active ? '#8b5cf6' : 'transparent'}`,
              fontWeight: 800, fontSize: '0.68rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              transition: 'all 0.2s ease', textDecoration: 'none'
            }}>
              {icon} {label}
            </Link>
          )
        })}
      </nav>

      {/* User Info + Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 800, color: 'white'
          }}>
            {getInitials(user?.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b5cf6' }}>
              SYSADMIN
            </div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{
            width: '100%', padding: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 'var(--radius-sm)', color: '#ef4444', fontWeight: 800,
            fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#ef4444' }}>
          <LogOut size={13} /> KELUAR
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{`
        @media (max-width: 768px) {
          .sysadmin-sidebar-desktop { display: none !important; }
          .sysadmin-topbar { display: flex !important; }
          .sysadmin-main { margin-left: 0 !important; padding: 68px 12px 24px !important; min-width: 0 !important; }
        }
        ${RESPONSIVE_TABLE_CSS}
        @media (min-width: 769px) {
          .sysadmin-sidebar-mobile-overlay { display: none !important; }
          .sysadmin-sidebar-mobile-drawer { display: none !important; }
          .sysadmin-topbar { display: none !important; }
        }
      `}</style>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-card)', color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
            fontWeight: 600, borderRadius: '8px'
          },
          success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } }
        }}
      />

      {/* Desktop Sidebar */}
      <aside className="sysadmin-sidebar-desktop" style={{
        width: 240, flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile Topbar */}
      <div className="sysadmin-topbar" style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        height: 56, background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-default)',
        alignItems: 'center', padding: '0 16px', gap: 12
      }}>
        <button onClick={() => setSidebarOpen(p => !p)} style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: sidebarOpen ? 'rgba(139,92,246,0.1)' : 'transparent',
          border: 'none', cursor: 'pointer',
          color: sidebarOpen ? '#8b5cf6' : 'var(--text-muted)'
        }}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--text-primary)' }}>DECANT </span>
          <span style={{ color: 'var(--accent-red)' }}>TEMCY</span>
        </div>
        <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.12em', color: '#8b5cf6', marginLeft: 4 }}>
          SYSADMIN
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="sysadmin-sidebar-mobile-overlay" onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 55,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }} />
      )}

      {/* Mobile Drawer */}
      <aside className="sysadmin-sidebar-mobile-drawer" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 56,
        width: 240,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)'
      }}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="sysadmin-main rt-scope" style={{
        flex: 1, marginLeft: 240,
        padding: '36px 36px',
        minHeight: '100vh', overflowX: 'hidden'
      }}>
        <Outlet />
      </main>
    </div>
  )
}