import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Flame, Star, ChevronRight, Zap } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const useInView = (threshold = 0.1) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

const ProductCard = ({ product, index }) => {
  const [ref, inView] = useInView()
  const [hovered, setHovered] = useState(false)

  return (
    <Link to={`/product/${product.product_id}`} ref={ref}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${hovered ? 'rgba(240,46,41,0.5)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', display: 'block',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s, border-color 0.3s, box-shadow 0.3s`,
        boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,46,41,0.15)' : 'none',
        textDecoration: 'none'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={{
        height: 200, background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-card))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: hovered ? 'radial-gradient(circle at center, rgba(240,46,41,0.1) 0%, transparent 70%)' : 'transparent',
          transition: '400ms ease'
        }} />

        {product.sold_count > 50 && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'var(--accent-red)',
            color: 'white', fontSize: '0.6rem', fontWeight: 800,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 'var(--radius-xs)',
            animation: 'pulse-glow-sm 2.5s infinite'
          }}>BEST SELLER</div>
        )}

        <div style={{
          fontSize: '4rem',
          transform: hovered ? 'scale(1.2) translateY(-5px)' : 'scale(1)',
          filter: hovered ? 'drop-shadow(0 8px 20px rgba(240,46,41,0.25))' : 'none',
          transition: '400ms cubic-bezier(0.4,0,0.2,1)',
          animation: 'float 4s ease-in-out infinite'
        }}>🧴</div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '10px 14px',
          background: 'linear-gradient(to top, rgba(6,6,10,0.95), transparent)',
          transform: hovered ? 'translateY(0)' : 'translateY(100%)',
          transition: '300ms ease',
          textAlign: 'center'
        }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 800,
            letterSpacing: '0.15em', color: 'var(--accent-red)',
            textTransform: 'uppercase'
          }}>LIHAT DETAIL →</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{
          fontSize: '0.65rem', fontWeight: 800,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--accent-red)', marginBottom: 6
        }}>{product.brand}</div>

        <div style={{
          fontWeight: 700, fontSize: '0.9rem',
          color: 'var(--text-primary)', marginBottom: 6,
          lineHeight: 1.3, letterSpacing: '-0.01em'
        }}>{product.product_name}</div>

        <div style={{
          fontSize: '0.74rem', color: 'var(--text-muted)',
          marginBottom: 14, fontWeight: 500
        }}>
          {product.concentration} · {product.gender}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 12, borderTop: '1px solid var(--border-default)'
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2, letterSpacing: '0.05em' }}>
              MULAI DARI
            </div>
            <div style={{
              fontWeight: 800, fontSize: '0.9rem',
              color: hovered ? 'var(--accent-red)' : 'var(--text-primary)',
              transition: '200ms ease', letterSpacing: '-0.01em'
            }}>
              {formatRupiah(product.price_1ml)}
              <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ml</span>
            </div>
          </div>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600,
            padding: '4px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em'
          }}>{product.longevity_display}</span>
        </div>
      </div>
    </Link>
  )
}

const SkeletonCard = () => (
  <div style={{
    background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
    overflow: 'hidden', border: '1px solid var(--border-default)'
  }}>
    <div className="skeleton" style={{ height: 200 }} />
    <div style={{ padding: '16px 18px 18px' }}>
      <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 16, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '55%', marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 1, marginBottom: 12 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 20, width: '45%' }} />
        <div className="skeleton" style={{ height: 22, width: '28%', borderRadius: 4 }} />
      </div>
    </div>
  </div>
)

const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView])
  return <span ref={ref}>{count}{suffix}</span>
}

const MARQUEE_BRANDS = [
  'AFNAN', 'AMTHRA', 'AOERA', 'MAISON MARGIELA',
  'LATTAFA', 'MONTALE', 'INITIO', 'MANCERA',
  'AFNAN', 'AMTHRA', 'AOERA', 'MAISON MARGIELA',
  'LATTAFA', 'MONTALE', 'INITIO', 'MANCERA'
]

export default function HomePage() {
  const [popular, setPopular] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroVisible, setHeroVisible] = useState(false)
  const navigate = useNavigate()

  const [popularRef, popularInView] = useInView()
  const [newRef, newInView] = useInView()
  const [ctaRef, ctaInView] = useInView()
  const [statsRef, statsInView] = useInView()

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [popRes, newRes] = await Promise.all([
        api.get('/recommendations/popular'),
        api.get('/products?limit=4')
      ])
      setPopular(popRes.data.products)
      setNewArrivals(newRes.data.products)
    } catch {
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', background: 'var(--bg-primary)' }}>

      {/* ===== HERO ===== */}
      <section style={{
        minHeight: '92vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', padding: '0 32px'
      }}>
        {/* BG Gradients */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 65% 40%, rgba(240,46,41,0.14) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 80%, rgba(162,18,14,0.08) 0%, transparent 45%),
            var(--bg-primary)
          `
        }} />

        {/* Animated geometric accent */}
        <div style={{
          position: 'absolute', right: '8%', top: '15%',
          width: 400, height: 400, opacity: 0.06
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            border: '1px solid var(--accent-red)',
            borderRadius: '50%',
            animation: 'rotate-slow 30s linear infinite'
          }} />
          <div style={{
            position: 'absolute', inset: 30,
            border: '1px solid var(--accent-red)',
            animation: 'rotate-reverse 20s linear infinite'
          }} />
          <div style={{
            position: 'absolute', inset: 60,
            border: '1px solid var(--accent-red)',
            borderRadius: '50%',
            animation: 'rotate-slow 15s linear infinite'
          }} />
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 700 }}>

            {/* Label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              marginBottom: 32,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease 0.1s'
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent-red)',
                animation: 'pulse-glow 2s infinite'
              }} />
              <span style={{
                fontSize: '0.68rem', fontWeight: 800,
                letterSpacing: '0.25em', textTransform: 'uppercase',
                color: 'var(--accent-red)'
              }}>Premium Parfum Decant</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2.8rem, 6.5vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              marginBottom: 28,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s ease 0.2s'
            }}>
              TEMUKAN
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #F02E29, #ff6b6b, #F02E29)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'redShimmer 4s linear infinite'
              }}>SIGNATURE</span>
              <br />
              SCENT KAMU
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '0.95rem', color: 'var(--text-secondary)',
              lineHeight: 1.9, marginBottom: 44, maxWidth: 480,
              fontWeight: 400,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s ease 0.35s'
            }}>
              Koleksi parfum premium dalam ukuran decant 1ml–5ml.
              Coba sebelum commit ke botol penuh. Anti blind buy.
            </p>

            {/* CTAs */}
            <div style={{
              display: 'flex', gap: 14, flexWrap: 'wrap',
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s ease 0.5s'
            }}>
              <button onClick={() => navigate('/catalog')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 32px',
                  background: 'var(--accent-red)', color: 'white',
                  fontWeight: 800, fontSize: '0.82rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(240,46,41,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(240,46,41,0.5)'
                  e.currentTarget.style.background = 'var(--accent-red-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(240,46,41,0.4)'
                  e.currentTarget.style.background = 'var(--accent-red)'
                }}>
                LIHAT KATALOG <ArrowRight size={16} />
              </button>

              <button onClick={() => navigate('/chatbot')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 28px',
                  background: 'transparent', color: 'var(--text-primary)',
                  fontWeight: 700, fontSize: '0.82rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hover)', cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-red)'
                  e.currentTarget.style.color = 'var(--accent-red)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}>
                <Zap size={15} /> AI ADVISOR
              </button>
            </div>

            {/* Trust badges */}
            <div style={{
              display: 'flex', gap: 32, marginTop: 52, flexWrap: 'wrap',
              opacity: heroVisible ? 1 : 0,
              transition: 'all 0.7s ease 0.65s'
            }}>
              {[
                { label: 'ORIGINAL 100%' },
                { label: 'PENGIRIMAN AMAN' },
                { label: 'PREMIUM QUALITY' }
              ].map(({ label }, i) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
		  {i > 0 && (
                    <span style={{ 
		      width: 4, height: 4, borderRadius: '50%',
          	      background: 'var(--accent-red)', opacity: 0.5,
          	      display: 'inline-block'
		    }} />
		  )}
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800,
                    letterSpacing: '0.18em', color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          opacity: heroVisible ? 0.6 : 0,
          transition: 'opacity 0.7s ease 0.9s'
        }}>
          <span style={{
            fontSize: '0.58rem', fontWeight: 800,
            letterSpacing: '0.25em', color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>SCROLL</span>
          <div style={{
            width: 1, height: 40,
            background: 'linear-gradient(to bottom, var(--accent-red), transparent)',
            animation: 'fadeInUp 1.5s ease infinite'
          }} />
        </div>
      </section>

      {/* ===== BRAND MARQUEE ===== */}
      <div style={{
        borderTop: '1px solid var(--border-default)',
        borderBottom: '1px solid var(--border-default)',
        padding: '18px 0', overflow: 'hidden',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          display: 'flex',
          animation: 'marquee 30s linear infinite'
        }}>
          {MARQUEE_BRANDS.map((brand, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 20,
              padding: '0 28px',
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.25em', color: 'var(--text-muted)',
              textTransform: 'uppercase', whiteSpace: 'nowrap'
            }}>
              {brand}
              <span style={{ color: 'var(--accent-red)', fontSize: '0.4rem' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ===== STATS ===== */}
      <section style={{ padding: '80px 32px' }} ref={statsRef}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2
          }}>
            {[
              { value: 50, suffix: '+', label: 'Produk Parfum', sub: 'Brand premium pilihan' },
              { value: 10, suffix: '+', label: 'Brand Ternama', sub: 'Koleksi eksklusif' },
              { value: 100, suffix: '%', label: 'Original', sub: 'Terjamin keasliannya' }
            ].map(({ value, suffix, label, sub }, i) => (
              <div key={label} style={{
                padding: '40px 32px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: i === 0 ? 'var(--radius-lg) 0 0 var(--radius-lg)' :
                  i === 2 ? '0 var(--radius-lg) var(--radius-lg) 0' : 'none',
                textAlign: 'center',
                opacity: statsInView ? 1 : 0,
                transform: statsInView ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.6s ease ${i * 0.15}s`
              }}>
                <div style={{
                  fontSize: '3rem', fontWeight: 900,
                  color: 'var(--accent-red)', marginBottom: 8,
                  letterSpacing: '-0.04em', lineHeight: 1
                }}>
                  <Counter end={value} suffix={suffix} />
                </div>
                <div style={{
                  fontSize: '0.72rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-primary)', marginBottom: 6
                }}>{label}</div>
                <div style={{
                  fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400
                }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POPULAR PRODUCTS ===== */}
      <section style={{ padding: '0 32px 80px' }} ref={popularRef}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: 40,
            opacity: popularInView ? 1 : 0,
            transform: popularInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease'
          }}>
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10
              }}>
                <Flame size={16} style={{ color: 'var(--accent-red)' }} />
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'var(--accent-red)'
                }}>Terlaris</span>
              </div>
              <h2 style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                fontWeight: 900, letterSpacing: '-0.03em',
                textTransform: 'uppercase'
              }}>Produk Populer</h2>
            </div>
            <Link to="/catalog" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.72rem', fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--accent-red)', textDecoration: 'none',
              transition: '200ms ease'
            }}
              onMouseEnter={e => e.currentTarget.style.gap = '10px'}
              onMouseLeave={e => e.currentTarget.style.gap = '6px'}
            >
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20
          }}>
            {loading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : popular.map((product, i) => (
                <ProductCard key={product.product_id} product={product} index={i} />
              ))
            }
          </div>
        </div>
      </section>

      {/* ===== AI ADVISOR BANNER ===== */}
      <section style={{ padding: '0 32px 80px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            padding: '56px 56px',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 32
          }}>
            {/* BG accent */}
            <div style={{
              position: 'absolute', right: -100, top: -100,
              width: 400, height: 400, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(240,46,41,0.08) 0%, transparent 70%)',
              animation: 'float 5s ease-in-out infinite'
            }} />
            <div style={{
              position: 'absolute', left: '45%', bottom: -60,
              width: 250, height: 250, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(162,18,14,0.06) 0%, transparent 70%)'
            }} />

            {/* Left */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '4px 14px',
                background: 'var(--accent-red-light)',
                border: '1px solid rgba(240,46,41,0.2)',
                borderRadius: 'var(--radius-xs)',
                marginBottom: 20
              }}>
                <Zap size={11} style={{ color: 'var(--accent-red)' }} />
                <span style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.2em', color: 'var(--accent-red)',
                  textTransform: 'uppercase'
                }}>AI-POWERED</span>
              </div>

              <h2 style={{
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 900, letterSpacing: '-0.03em',
                textTransform: 'uppercase', marginBottom: 12
              }}>BINGUNG PILIH PARFUM?</h2>

              <p style={{
                color: 'var(--text-secondary)', fontSize: '0.88rem',
                lineHeight: 1.8, fontWeight: 400
              }}>
                Chatbot AI kami siap membantu menemukan parfum yang tepat
                berdasarkan preferensi dan kepribadian kamu.
              </p>
            </div>

            {/* Right */}
            <button onClick={() => navigate('/chatbot')}
              style={{
                position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '16px 36px',
                background: 'var(--accent-red)', color: 'white',
                fontWeight: 800, fontSize: '0.82rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(240,46,41,0.35)',
                transition: 'all 0.3s ease', flexShrink: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(240,46,41,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(240,46,41,0.35)'
              }}>
              MULAI CHAT <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ===== NEW ARRIVALS ===== */}
      <section style={{
        padding: '80px 32px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-default)'
      }} ref={newRef}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: 40,
            opacity: newInView ? 1 : 0,
            transform: newInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Star size={16} style={{ color: 'var(--accent-red)' }} />
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'var(--accent-red)'
                }}>Terbaru</span>
              </div>
              <h2 style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                fontWeight: 900, letterSpacing: '-0.03em',
                textTransform: 'uppercase'
              }}>Produk Terbaru</h2>
            </div>
            <Link to="/catalog" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.72rem', fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--accent-red)', textDecoration: 'none'
            }}>
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20
          }}>
            {loading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : newArrivals.map((product, i) => (
                <ProductCard key={product.product_id} product={product} index={i} />
              ))
            }
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'var(--accent-red)', marginBottom: 12
            }}>Jelajahi</div>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 900, letterSpacing: '-0.03em',
              textTransform: 'uppercase', marginBottom: 10
            }}>Berdasarkan Aroma</h2>
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 400
            }}>
              Temukan parfum yang sesuai karakter kamu
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12
          }}>
            {[
              { icon: '🌸', label: 'Floral', query: 'Floral' },
              { icon: '🌲', label: 'Woody', query: 'Woody' },
              { icon: '🍋', label: 'Citrus', query: 'Citrus' },
              { icon: '🌶️', label: 'Spicy', query: 'Spicy' },
              { icon: '🌊', label: 'Aquatic', query: 'Aquatic' },
              { icon: '🌿', label: 'Fresh', query: 'Fresh' },
              { icon: '🍦', label: 'Vanilla', query: 'Vanilla' },
              { icon: '🪨', label: 'Musky', query: 'Musky' }
            ].map(({ icon, label, query }, i) => (
              <button key={label}
                onClick={() => navigate(`/catalog?search=${query}`)}
                style={{
                  padding: '22px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.25s ease',
                  animation: `fadeInUp 0.5s ease ${i * 0.05}s both`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-red)'
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.background = 'rgba(240,46,41,0.05)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'var(--bg-card)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{icon}</div>
                <div style={{
                  fontSize: '0.68rem', fontWeight: 800,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--text-secondary)'
                }}>{label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FLOATING CHATBOT ===== */}
      <button
        onClick={() => navigate('/chatbot')}
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent-red)', color: 'white',
          border: '2px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', zIndex: 50,
          boxShadow: '0 4px 24px rgba(240,46,41,0.5)',
          animation: 'pulse-glow-sm 3s ease-in-out infinite',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="AI Advisor"
      >
        ✨
      </button>

    </div>
  )
}