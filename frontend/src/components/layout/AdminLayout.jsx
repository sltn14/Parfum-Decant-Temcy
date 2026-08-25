import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart2, Star, LogOut } from 'lucide-react'

const navLinks = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/products', icon: <Package size={18} />, label: 'Produk' },
  { to: '/admin/orders', icon: <ShoppingBag size={18} />, label: 'Pesanan' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'Users' },
  { to: '/admin/reviews', icon: <Star size={18} />, label: 'Reviews' },
  { to: '/admin/sales-report', icon: <BarChart2 size={18} />, label: 'Laporan' },
]

const AdminLayout = () => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border-default)'
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem', fontWeight: 700
          }}>
            Decant <span style={{ color: 'var(--accent-red)' }}>Temcy</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Admin Panel
          </div>
        </div>

        {/* User Info */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-default)'
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user?.full_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {navLinks.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                marginBottom: 4,
                background: isActive ? 'rgba(185,28,28,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                color: isActive ? 'var(--accent-red)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.88rem', textDecoration: 'none',
                transition: '150ms ease'
              })}>
              {icon} {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-default)' }}>
          <button onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', width: '100%',
              borderRadius: 'var(--radius-md)',
              color: '#ef4444', fontSize: '0.88rem',
              cursor: 'pointer', background: 'transparent', border: 'none'
            }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1, marginLeft: 240,
        padding: 32, minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout