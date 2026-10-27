import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LayoutDashboard, Package, ShoppingBag, BarChart2, Star, Tag, Sparkles, Archive, LogOut, Menu, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../api/axios'

const navLinks = [
  { to: '/admin', icon: <LayoutDashboard size={16} />, label: 'DASHBOARD', exact: true },
  { to: '/admin/products', icon: <Package size={16} />, label: 'PRODUK' },
  { to: '/admin/inventory', icon: <Archive size={16} />, label: 'INVENTARIS' },
  { to: '/admin/orders', icon: <ShoppingBag size={16} />, label: 'PESANAN' },
  { to: '/admin/reviews', icon: <Star size={16} />, label: 'REVIEWS' },
  { to: '/admin/vouchers', icon: <Tag size={16} />, label: 'VOUCHER' },
  { to: '/admin/sales-report', icon: <BarChart2 size={16} />, label: 'LAPORAN' },
  { to: '/admin/ai-insight', icon: <Sparkles size={16} />, label: 'AI INSIGHT' },
]

export default function AdminLayout() {
  const location = useLocation()
  const { user, clearAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    if (!name) return 'A'
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
        <div style={{ marginTop: 8, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-red)' }}>
          ADMIN PANEL
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
              color: active ? 'var(--accent-red)' : 'var(--text-muted)',
              background: active ? 'rgba(240,46,41,0.08)' : 'transparent',
              borderLeft: `3px solid ${active ? 'var(--accent-red)' : 'transparent'}`,
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
            background: 'linear-gradient(135deg, var(--accent-red), #A2120E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 800, color: 'white'
          }}>
            {getInitials(user?.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-red)' }}>
              ADMIN TOKO
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
          .admin-sidebar-desktop { display: none !important; }
          .admin-topbar { display: flex !important; }
          .admin-main { margin-left: 0 !important; padding: 80px 16px 32px !important; }
        }
        @media (min-width: 769px) {
          .admin-sidebar-mobile-overlay { display: none !important; }
          .admin-sidebar-mobile-drawer { display: none !important; }
          .admin-topbar { display: none !important; }
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
      <aside className="admin-sidebar-desktop" style={{
        width: 240, flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile Topbar */}
      <div className="admin-topbar" style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        height: 56, background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-default)',
        alignItems: 'center', padding: '0 16px', gap: 12
      }}>
        <button onClick={() => setSidebarOpen(p => !p)} style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: sidebarOpen ? 'rgba(240,46,41,0.1)' : 'transparent',
          border: 'none', cursor: 'pointer',
          color: sidebarOpen ? 'var(--accent-red)' : 'var(--text-muted)'
        }}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--text-primary)' }}>DECANT </span>
          <span style={{ color: 'var(--accent-red)' }}>TEMCY</span>
        </div>
        <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--accent-red)', marginLeft: 4 }}>
          ADMIN
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="admin-sidebar-mobile-overlay" onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 55,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }} />
      )}

      {/* Mobile Drawer */}
      <aside className="admin-sidebar-mobile-drawer" style={{
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
      <main className="admin-main" style={{
        flex: 1, marginLeft: 240,
        padding: '36px 36px',
        minHeight: '100vh', overflowX: 'hidden'
      }}>
        <Outlet />
      </main>
    </div>
  )
}