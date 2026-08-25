import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User, LogOut, ChevronDown, LogIn, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import useSearchStore from '../../store/searchStore'
import api from '../../api/axios'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const { cartCount } = useCartStore()
  const { setQuery } = useSearchStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    clearAuth()
    setDropdownOpen(false)
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      setQuery(search)
      navigate(`/catalog?search=${search}`)
      setSearchOpen(false)
      setSearch('')
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
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 'var(--navbar-height)',
        background: scrolled
          ? 'rgba(6,6,10,0.92)'
          : 'rgba(6,6,10,0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled
          ? '1px solid rgba(200,16,46,0.15)'
          : '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.5)' : 'none'
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 32px',
          height: '100%', display: 'flex', alignItems: 'center', gap: 40
        }}>

          {/* Logo */}
	  <Link to="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
	    <div style={{
	      width: 42, height: 42, overflow: 'hidden',
    	      display: 'flex', alignItems: 'center', justifyContent: 'center'
  	    }}>
              <img
	        src="/logo.png"
	        alt="DT"
	        style={{
		  width: 130, height: 130,
		  objectFit: 'contain',
		  filter: 'brightness(0) invert(1)', // bikin putih di dark background
		  transform: 'scale(2.2)',
                }}
	      />
	    </div>
	    <div style={{
	      fontFamily: 'var(--font-sans)',
   	      fontWeight: 900, fontSize: '0.85rem',
    	      letterSpacing: '0.1em', textTransform: 'uppercase',
    	      lineHeight: 1.2
	    }}>
	      <span style={{ color: 'var(--text-primary)' }}>DECANT </span>
    	      <span style={{ color: 'var(--accent-red)' }}>TEMCY</span>
	    </div>
          </Link>

          {/* Nav Links */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {[
              { to: '/', label: 'Beranda' },
              { to: '/catalog', label: 'Katalog' },
              { to: '/chatbot', label: 'AI Advisor' }
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                padding: '8px 16px',
                fontSize: '0.85rem', fontWeight: 500,
                letterSpacing: '0.04em',
                color: isActive(to) ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                background: isActive(to) ? 'rgba(200,16,46,0.12)' : 'transparent',
                border: isActive(to) ? '1px solid rgba(200,16,46,0.2)' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
                onMouseEnter={e => {
                  if (!isActive(to)) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => {
                  if (!isActive(to)) e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Search Toggle */}
            <button ref={searchRef} onClick={() => setSearchOpen(prev => !prev)}
              style={{
                width: 40, height: 40, borderRadius: 'var(--radius-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
                background: searchOpen ? 'rgba(200,16,46,0.1)' : 'transparent',
                border: '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.background = searchOpen ? 'rgba(200,16,46,0.1)' : 'transparent'
              }}>
              <Search size={18} />
            </button>

            {/* Notif */}
            <NotificationBell />

            {/* Cart */}
            <Link to="/cart" style={{
              position: 'relative',
              width: 40, height: 40, borderRadius: 'var(--radius-full)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
              border: '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.background = 'transparent'
              }}>
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--accent-red)', color: 'white',
                  fontSize: '0.6rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'pulse-glow 2s infinite'
                }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button onClick={() => setDropdownOpen(prev => !prev)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px 6px 6px',
                    background: dropdownOpen
                      ? 'rgba(200,16,46,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${dropdownOpen ? 'rgba(200,16,46,0.3)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-red), #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700, color: 'white',
                    letterSpacing: '0.05em'
                  }}>
                    {getInitials(user?.full_name)}
                  </div>
                  <ChevronDown size={14} style={{
                    color: 'var(--text-muted)',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: '200ms ease'
                  }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                    background: 'rgba(17,17,24,0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    minWidth: 220, overflow: 'hidden',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    animation: 'fadeInDown 0.2s ease'
                  }}>
                    <div style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border-default)',
                      background: 'linear-gradient(135deg, rgba(200,16,46,0.06), transparent)'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
                        {user?.full_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {user?.email}
                      </div>
                    </div>

                    {[
                      { to: '/profile', icon: <User size={14} />, label: 'Profil Saya' },
                      { to: '/orders', icon: <ShoppingCart size={14} />, label: 'Pesanan Saya' }
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to}
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 20px', fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          transition: '150ms ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = 'var(--text-primary)'
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'var(--text-secondary)'
                          e.currentTarget.style.background = 'transparent'
                        }}>
                        {icon} {label}
                      </Link>
                    ))}

                    {user?.role === 'admin' && (
                      <Link to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 20px', fontSize: '0.85rem',
                          color: 'var(--accent-gold)'
                        }}>
                        👑 Admin Panel
                      </Link>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-default)' }}>
                      <button onClick={handleLogout}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 20px', width: '100%',
                          fontSize: '0.85rem', color: '#f87171', cursor: 'pointer',
                          transition: '150ms ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <LogOut size={14} /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px',
                background: 'linear-gradient(135deg, var(--accent-red), #e11d48)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem', fontWeight: 600, color: 'white',
                letterSpacing: '0.02em',
                boxShadow: '0 4px 16px rgba(200,16,46,0.3)',
                transition: 'all 0.3s ease'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,16,46,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(200,16,46,0.3)'
                }}>
                <LogIn size={15} /> Masuk
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div style={{
          position: 'fixed', top: 'var(--navbar-height)', left: 0, right: 0,
          zIndex: 99, padding: '20px 32px',
          background: 'rgba(6,6,10,0.95)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border-default)',
          animation: 'fadeInDown 0.2s ease'
        }}>
          <form onSubmit={handleSearch} style={{
            maxWidth: 600, margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <Search size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              placeholder="Cari parfum, brand, atau aroma..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '1.1rem',
                fontFamily: 'var(--font-sans)'
              }}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}
                style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            )}
            <button type="submit" style={{
              padding: '8px 20px',
              background: 'var(--accent-red)', color: 'white',
              borderRadius: 'var(--radius-full)', fontWeight: 600,
              fontSize: '0.85rem'
            }}>
              Cari
            </button>
          </form>
        </div>
      )}
    </>
  )
}