import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User, LogOut, ChevronDown, LogIn, X, Heart, MapPin, Clock, Menu } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('search-history') || '[]')
    } catch { return [] }
  })
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  const isActive = (path) => location.pathname === path

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

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

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    sessionStorage.setItem('logging-out', 'true')
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    clearAuth()
    try { await api.post('/auth/logout') } catch {}
    sessionStorage.removeItem('logging-out')
    window.location.href = '/'
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) doSearch(search.trim())
  }

  const doSearch = (query) => {
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 6)
    setSearchHistory(newHistory)
    localStorage.setItem('search-history', JSON.stringify(newHistory))
    setQuery(query)
    navigate(`/catalog?search=${encodeURIComponent(query)}`)
    setSearchOpen(false)
    setMobileMenuOpen(false)
    setSearch('')
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('search-history')
  }

  const removeHistoryItem = (item, e) => {
    e.stopPropagation()
    const newHistory = searchHistory.filter(h => h !== item)
    setSearchHistory(newHistory)
    localStorage.setItem('search-history', JSON.stringify(newHistory))
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const getAvatarSrc = () => {
    if (user?.avatar && user.avatar !== 'default-avatar.png') {
      return `http://localhost:5000/uploads/avatars/${user.avatar}`
    }
    return null
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .navbar-links { display: none !important; }
          .navbar-actions-desktop { display: none !important; }
          .navbar-mobile-right { display: flex !important; }
          .navbar-inner { padding: 0 16px !important; gap: 0 !important; }
        }
        @media (min-width: 769px) {
          .navbar-mobile-right { display: none !important; }
          .navbar-hamburger { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 'var(--navbar-height)',
        background: scrolled ? 'rgba(6,6,10,0.95)' : 'rgba(6,6,10,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled
          ? '1px solid rgba(240,46,41,0.12)'
          : '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.5)' : 'none'
      }}>
        <div className="navbar-inner" style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 32px',
          height: '100%', display: 'flex', alignItems: 'center', gap: 32
        }}>

          {/* Logo */}
          <Link to="/" style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none'
          }}>
            <div style={{
              width: 40, height: 40, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <img
                src="/logo.png"
                alt="DT"
                style={{
                  width: 120, height: 120,
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                  transform: 'scale(2.2)',
                  transformOrigin: 'center'
                }}
              />
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 900, fontSize: '0.85rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              lineHeight: 1.1
            }}>
              <span style={{ color: 'var(--text-primary)' }}>DECANT </span>
              <span style={{ color: 'var(--accent-red)' }}>TEMCY</span>
            </div>
          </Link>

          {/* Nav Links — desktop only */}
          <div className="navbar-links" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[
              { to: '/', label: 'Beranda' },
              { to: '/catalog', label: 'Katalog' },
              { to: '/chatbot', label: 'Konsultasi' }
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                padding: '7px 14px',
                fontSize: '0.78rem', fontWeight: 700,
                letterSpacing: '0.06em',
                color: isActive(to) ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                background: isActive(to) ? 'rgba(240,46,41,0.1)' : 'transparent',
                border: isActive(to) ? '1px solid rgba(240,46,41,0.2)' : '1px solid transparent',
                transition: 'all 0.2s ease', textDecoration: 'none'
              }}
                onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Actions — desktop only */}
          <div className="navbar-actions-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Search */}
            <button
              onClick={() => setSearchOpen(prev => !prev)}
              style={{
                width: 38, height: 38, borderRadius: 'var(--radius-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: searchOpen ? 'var(--text-primary)' : 'var(--text-muted)',
                background: searchOpen ? 'rgba(240,46,41,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                flexShrink: 0
              }}>
              <Search size={17} />
            </button>

            <NotificationBell />

            {isAuthenticated && (
              <Link to="/favorites" style={{
                width: 38, height: 38, borderRadius: 'var(--radius-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', border: 'none',
                transition: 'all 0.2s ease', textDecoration: 'none',
                background: 'transparent', flexShrink: 0
              }}>
                <Heart size={17} />
              </Link>
            )}

            <Link to="/cart" style={{
              width: 38, height: 38, borderRadius: 'var(--radius-full)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', border: 'none',
              transition: 'all 0.2s ease', textDecoration: 'none',
              position: 'relative', flexShrink: 0, background: 'transparent'
            }}>
              <ShoppingCart size={17} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 15, height: 15, borderRadius: '50%',
                  background: 'var(--accent-red)', color: 'white',
                  fontSize: '0.55rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1
                }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px 5px 5px',
                    background: dropdownOpen ? 'rgba(240,46,41,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${dropdownOpen ? 'rgba(240,46,41,0.3)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}>
                  {getAvatarSrc() ? (
                    <img src={getAvatarSrc()} alt="Avatar"
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent-red)' }}
                    />
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-red), #A2120E)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.68rem', fontWeight: 800, color: 'white'
                    }}>
                      {getInitials(user?.full_name)}
                    </div>
                  )}
                  <ChevronDown size={13} style={{
                    color: 'var(--text-muted)',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: '200ms ease'
                  }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    background: 'rgba(13,13,20,0.98)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    minWidth: 220, overflow: 'hidden',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                    animation: 'fadeInDown 0.2s ease'
                  }}>
                    <div style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border-default)',
                      background: 'linear-gradient(135deg, rgba(240,46,41,0.06), transparent)'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 2 }}>{user?.full_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{user?.email}</div>
                    </div>
                    {[
                      { to: '/profile', icon: <User size={13} />, label: 'Profil Saya' },
                      { to: '/orders', icon: <ShoppingCart size={13} />, label: 'Pesanan Saya' },
                      { to: '/favorites', icon: <Heart size={13} />, label: 'Favorit Saya' },
                      { to: '/addresses', icon: <MapPin size={13} />, label: 'Alamat Saya' }
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to} onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 18px', fontSize: '0.82rem',
                          color: 'var(--text-secondary)', fontWeight: 600,
                          transition: '150ms ease', textDecoration: 'none'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}>
                        {icon} {label}
                      </Link>
                    ))}
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 18px', fontSize: '0.82rem',
                          color: 'var(--accent-red)', fontWeight: 700,
                          textDecoration: 'none', transition: '150ms ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,46,41,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        Admin Panel
                      </Link>
                    )}
                    <div style={{ borderTop: '1px solid var(--border-default)' }}>
                      <button onClick={handleLogout}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 18px', width: '100%',
                          fontSize: '0.82rem', color: '#f87171',
                          fontWeight: 600, cursor: 'pointer',
                          transition: '150ms ease', background: 'none', border: 'none'
                        }}>
                        <LogOut size={13} /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 18px',
                background: 'linear-gradient(135deg, var(--accent-red), #e11d18)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem', fontWeight: 800,
                letterSpacing: '0.06em', color: 'white',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(240,46,41,0.3)',
                transition: 'all 0.3s ease'
              }}>
                <LogIn size={14} /> MASUK
              </Link>
            )}
          </div>

          {/* Mobile right icons */}
          <div className="navbar-mobile-right" style={{
            display: 'none', alignItems: 'center', gap: 4, marginLeft: 'auto'
          }}>
            {/* Search */}
            <button onClick={() => { setSearchOpen(p => !p); setMobileMenuOpen(false) }}
              style={{
                width: 38, height: 38, borderRadius: 'var(--radius-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', background: 'transparent',
                border: 'none', cursor: 'pointer'
              }}>
              <Search size={18} />
            </button>

            {/* Cart */}
            <Link to="/cart" style={{
              width: 38, height: 38, borderRadius: 'var(--radius-full)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', textDecoration: 'none',
              position: 'relative', background: 'transparent'
            }}>
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 15, height: 15, borderRadius: '50%',
                  background: 'var(--accent-red)', color: 'white',
                  fontSize: '0.55rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              className="navbar-hamburger"
              onClick={() => { setMobileMenuOpen(p => !p); setSearchOpen(false) }}
              style={{
                width: 38, height: 38, borderRadius: 'var(--radius-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: mobileMenuOpen ? 'var(--accent-red)' : 'var(--text-muted)',
                background: mobileMenuOpen ? 'rgba(240,46,41,0.1)' : 'transparent',
                border: mobileMenuOpen ? '1px solid rgba(240,46,41,0.2)' : '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}>
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: 'var(--navbar-height)', left: 0, right: 0, bottom: 0,
          zIndex: 99, background: 'rgba(6,6,10,0.98)',
          backdropFilter: 'blur(24px)',
          overflowY: 'auto',
          animation: 'fadeInDown 0.2s ease',
          display: 'none'
        }}
          className="mobile-menu-drawer"
        >
          <style>{`
            @media (max-width: 768px) {
              .mobile-menu-drawer { display: block !important; }
            }
          `}</style>

          <div style={{ padding: '24px 20px' }}>
            {/* User info kalau login */}
            {isAuthenticated && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px', marginBottom: 24,
                background: 'rgba(240,46,41,0.06)',
                border: '1px solid rgba(240,46,41,0.15)',
                borderRadius: 'var(--radius-lg)'
              }}>
                {getAvatarSrc() ? (
                  <img src={getAvatarSrc()} alt="Avatar"
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-red)', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--accent-red), #A2120E)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 800, color: 'white'
                  }}>
                    {getInitials(user?.full_name)}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{user?.full_name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <div style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.2em',
                color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 4
              }}>MENU</div>
              {[
                { to: '/', label: 'Beranda' },
                { to: '/catalog', label: 'Katalog' },
                { to: '/chatbot', label: 'Konsultasi' }
              ].map(({ to, label }) => (
                <Link key={to} to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', marginBottom: 4,
                    background: isActive(to) ? 'rgba(240,46,41,0.08)' : 'transparent',
                    border: `1px solid ${isActive(to) ? 'rgba(240,46,41,0.2)' : 'transparent'}`,
                    borderRadius: 'var(--radius-md)',
                    color: isActive(to) ? 'var(--accent-red)' : 'var(--text-primary)',
                    fontSize: '1rem', fontWeight: 700, textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}>
                  {label}
                  {isActive(to) && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)' }} />}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-default)', margin: '16px 0' }} />

            {/* Account Links */}
            {isAuthenticated ? (
              <div>
                <div style={{
                  fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.2em',
                  color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 4
                }}>AKUN</div>
                {[
                  { to: '/profile', icon: <User size={16} />, label: 'Profil Saya' },
                  { to: '/orders', icon: <ShoppingCart size={16} />, label: 'Pesanan Saya' },
                  { to: '/favorites', icon: <Heart size={16} />, label: 'Favorit Saya' },
                  { to: '/addresses', icon: <MapPin size={16} />, label: 'Alamat Saya' }
                ].map(({ to, icon, label }) => (
                  <Link key={to} to={to} onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px', marginBottom: 4,
                      color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600,
                      textDecoration: 'none', borderRadius: 'var(--radius-md)',
                      transition: 'all 0.15s ease'
                    }}>
                    <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
                    {label}
                  </Link>
                ))}

                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px', marginBottom: 4,
                      color: 'var(--accent-red)', fontSize: '0.9rem', fontWeight: 700,
                      textDecoration: 'none', borderRadius: 'var(--radius-md)',
                      background: 'rgba(240,46,41,0.06)'
                    }}>
                    Admin Panel
                  </Link>
                )}

                <div style={{ height: 1, background: 'var(--border-default)', margin: '12px 0' }} />

                <button onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', width: '100%',
                    color: '#f87171', fontSize: '0.9rem', fontWeight: 600,
                    cursor: 'pointer', background: 'none', border: 'none',
                    borderRadius: 'var(--radius-md)', textAlign: 'left'
                  }}>
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px',
                  background: 'linear-gradient(135deg, var(--accent-red), #e11d18)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem', fontWeight: 800,
                  letterSpacing: '0.06em', color: 'white',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(240,46,41,0.3)'
                }}>
                <LogIn size={16} /> MASUK
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {searchOpen && (
        <div ref={searchRef} style={{
          position: 'fixed', top: 'var(--navbar-height)', left: 0, right: 0,
          zIndex: 99, padding: '20px 20px 24px',
          background: 'rgba(6,6,10,0.97)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border-default)',
          animation: 'fadeInDown 0.2s ease'
        }}>
          <form onSubmit={handleSearch} style={{
            maxWidth: 600, margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              autoFocus type="text"
              placeholder="Cari parfum, brand, atau aroma..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '1rem',
                fontFamily: 'var(--font-sans)', fontWeight: 500
              }}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, background: 'none', border: 'none' }}>
                <X size={16} />
              </button>
            )}
            <button type="submit" style={{
              padding: '8px 18px',
              background: 'var(--accent-red)', color: 'white',
              borderRadius: 'var(--radius-full)', fontWeight: 800,
              fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
              border: 'none', cursor: 'pointer', flexShrink: 0
            }}>CARI</button>
          </form>

          {!search && searchHistory.length > 0 && (
            <div style={{ maxWidth: 600, margin: '18px auto 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>RIWAYAT PENCARIAN</span>
                <button onClick={clearHistory} style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}>Hapus Semua</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {searchHistory.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)', overflow: 'hidden'
                  }}>
                    <button onClick={() => doSearch(h)}
                      style={{ padding: '6px 10px 6px 12px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none' }}>
                      <Clock size={11} style={{ flexShrink: 0 }} /> {h}
                    </button>
                    <button onClick={(e) => removeHistoryItem(h, e)}
                      style={{ padding: '6px 8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'none', border: 'none', borderLeft: '1px solid var(--border-default)' }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!search && searchHistory.length === 0 && (
            <div style={{ maxWidth: 600, margin: '18px auto 0' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>POPULER</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Woody', 'Floral', 'Citrus', 'Oud', 'Fresh', 'Vanilla'].map(s => (
                  <button key={s} onClick={() => doSearch(s)}
                    style={{ padding: '6px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}