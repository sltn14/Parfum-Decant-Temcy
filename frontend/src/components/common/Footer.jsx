import { Link } from 'react-router-dom'
import { FaInstagram, FaWhatsapp } from 'react-icons/fa'
import { Mail } from 'lucide-react'

const MARQUEE_ITEMS = [
  'PREMIUM PARFUM', 'DECANT TEMCY', 'ORIGINAL 100%',
  'ANTI BLIND BUY', 'PREMIUM PARFUM', 'DECANT TEMCY',
  'ORIGINAL 100%', 'ANTI BLIND BUY'
]

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-default)'
    }}>
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 64px;
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 24px !important;
            margin-bottom: 32px !important;
          }
          .footer-brand-col {
            grid-column: 1 / -1;
          }
          .footer-brand-col p {
            font-size: 0.78rem !important;
            max-width: 100% !important;
          }
          .footer-col-title {
            font-size: 0.6rem !important;
            margin-bottom: 12px !important;
          }
          .footer-col-link {
            font-size: 0.75rem !important;
            margin-bottom: 8px !important;
          }
          .footer-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .footer-bottom p, .footer-bottom span {
            font-size: 0.7rem !important;
          }
          .footer-main-padding {
            padding: 32px 16px 24px !important;
          }
          .footer-badge {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>

      {/* Marquee Strip */}
      <div style={{
        background: 'var(--accent-red)',
        padding: '12px 0',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          animation: 'marquee 25s linear infinite'
        }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 16,
              padding: '0 24px',
              fontSize: '0.72rem', fontWeight: 800,
              letterSpacing: '0.2em', color: 'white',
              textTransform: 'uppercase', whiteSpace: 'nowrap'
            }}>
              {item}
              <span style={{ opacity: 0.4, fontSize: '0.5rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main-padding" style={{ maxWidth: 1400, margin: '0 auto', padding: '64px 32px 40px' }}>
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand-col">
            <div style={{ marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16
              }}>
                <img
                  src="/logo.png"
                  alt="Decant Temcy"
                  style={{
                    width: 120, height: 120,
                    filter: 'brightness(0) invert(1)',
                    transform: 'scale(2.2)', objectFit: 'contain'
                  }}
                />
              </div>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem', lineHeight: 1.9,
                maxWidth: 320, fontWeight: 400
              }}>
                Marketplace parfum decant premium. Temukan signature scent kamu tanpa risiko blind buy.
                Tersedia dalam ukuran 1ml, 2ml, 3ml, dan 5ml.
              </p>
            </div>

            {/* Social */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { icon: <FaInstagram size={16} />, label: 'Instagram', href: 'https://www.instagram.com/decant.temcy' },
                { icon: <FaWhatsapp size={16} />, label: 'WhatsApp', href: 'https://wa.me/6285128061012' },
                { icon: <Mail size={16} />, label: 'Email', href: null }
              ].map(({ icon, label, href }) => (
                href ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                      color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s ease', textDecoration: 'none'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent-red)'
                      e.currentTarget.style.color = 'var(--accent-red)'
                      e.currentTarget.style.background = 'rgba(240,46,41,0.06)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-default)'
                      e.currentTarget.style.color = 'var(--text-muted)'
                      e.currentTarget.style.background = 'var(--bg-elevated)'
                    }}>
                    {icon}
                  </a>
                ) : (
                  <div key={label} title="Segera hadir"
                    style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                      color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.4, cursor: 'not-allowed'
                    }}>
                    {icon}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Navigasi */}
          <div>
            <div className="footer-col-title" style={{
              fontSize: '0.68rem', fontWeight: 800,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text-primary)', marginBottom: 20
            }}>Navigasi</div>
            {[
              { to: '/', label: 'Beranda' },
              { to: '/catalog', label: 'Katalog' },
              { to: '/chatbot', label: 'Konsultasi' }
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="footer-col-link" style={{
                display: 'block', color: 'var(--text-muted)',
                fontSize: '0.85rem', marginBottom: 12,
                fontWeight: 500, transition: 'color 0.2s ease', textDecoration: 'none'
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{label}</Link>
            ))}
          </div>

          {/* Akun */}
          <div>
            <div className="footer-col-title" style={{
              fontSize: '0.68rem', fontWeight: 800,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text-primary)', marginBottom: 20
            }}>Akun</div>
            {[
              { to: '/login', label: 'Masuk' },
              { to: '/register', label: 'Daftar' },
              { to: '/orders', label: 'Pesanan Saya' },
              { to: '/profile', label: 'Profil' },
              { to: '/favorites', label: 'Favorit' },
              { to: '/addresses', label: 'Alamat' }
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="footer-col-link" style={{
                display: 'block', color: 'var(--text-muted)',
                fontSize: '0.85rem', marginBottom: 12,
                fontWeight: 500, transition: 'color 0.2s ease', textDecoration: 'none'
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{label}</Link>
            ))}
          </div>

          {/* Layanan */}
          <div>
            <div className="footer-col-title" style={{
              fontSize: '0.68rem', fontWeight: 800,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text-primary)', marginBottom: 20
            }}>Layanan</div>
            {[
              { to: '/catalog', label: 'Cari Parfum' },
              { to: '/chatbot', label: 'Konsultasi Parfum' },
              { to: '/register', label: 'Bergabung' }
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="footer-col-link" style={{
                display: 'block', color: 'var(--text-muted)',
                fontSize: '0.85rem', marginBottom: 12,
                fontWeight: 500, transition: 'color 0.2s ease', textDecoration: 'none'
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{label}</Link>
            ))}

            {/* Badge */}
            <div className="footer-badge" style={{
              marginTop: 20, padding: '10px 14px',
              background: 'rgba(240,46,41,0.06)',
              border: '1px solid rgba(240,46,41,0.15)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 800,
                letterSpacing: '0.15em', color: 'var(--accent-red)',
                textTransform: 'uppercase', marginBottom: 4
              }}>Original 100%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Semua produk terjamin keasliannya
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)',
          marginBottom: 32
        }} />

        {/* Bottom */}
        <div className="footer-bottom">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 400 }}>
            © 2025 <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Decant Temcy</span>.
            All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {['Kebijakan Privasi', 'Syarat & Ketentuan'].map(label => (
              <span key={label} style={{
                fontSize: '0.78rem', color: 'var(--text-muted)',
                cursor: 'pointer', fontWeight: 400, transition: 'color 0.2s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{label}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}