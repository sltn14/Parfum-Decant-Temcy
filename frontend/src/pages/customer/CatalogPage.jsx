import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import useSearchStore from '../../store/searchStore'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const useInView = (threshold = 0.1) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
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
        border: `1px solid ${hovered ? 'rgba(200,16,46,0.4)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', display: 'block',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        transition: `opacity 0.5s ease ${index * 0.07}s, transform 0.5s ease ${index * 0.07}s, border-color 0.3s, box-shadow 0.3s`,
        boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,16,46,0.15)' : 'none'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Area */}
      <div style={{
        height: 200, background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-card))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: hovered
            ? 'radial-gradient(circle at center, rgba(200,16,46,0.12) 0%, transparent 70%)'
            : 'transparent',
          transition: '400ms ease'
        }} />

        {product.sold_count > 50 && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'linear-gradient(135deg, #c8102e, #e11d48)',
            color: 'white', fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 'var(--radius-full)',
            boxShadow: '0 4px 12px rgba(200,16,46,0.4)'
          }}>🔥 Best Seller</div>
        )}

        <div style={{
          fontSize: '4rem',
          transform: hovered ? 'scale(1.2) translateY(-5px)' : 'scale(1)',
          filter: hovered ? 'drop-shadow(0 8px 20px rgba(200,16,46,0.3))' : 'none',
          transition: '400ms cubic-bezier(0.4,0,0.2,1)'
        }}>🧴</div>

        {/* Hover CTA */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          background: 'linear-gradient(to top, rgba(6,6,10,0.9), transparent)',
          transform: hovered ? 'translateY(0)' : 'translateY(100%)',
          transition: '300ms ease',
          textAlign: 'center', fontSize: '0.78rem',
          color: 'var(--accent-red)', fontWeight: 600, letterSpacing: '0.06em'
        }}>
          LIHAT DETAIL →
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent-gold)', marginBottom: 6
        }}>
          {product.brand}
        </div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1rem', fontWeight: 400,
          color: 'var(--text-primary)', marginBottom: 8,
          lineHeight: 1.3
        }}>
          {product.product_name}
        </div>
        <div style={{
          fontSize: '0.74rem', color: 'var(--text-muted)',
          marginBottom: 14, display: 'flex', gap: 8
        }}>
          <span>{product.concentration}</span>
          <span>·</span>
          <span>{product.gender}</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12, borderTop: '1px solid var(--border-default)'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>
              Mulai dari
            </div>
            <div style={{
              fontWeight: 700, fontSize: '0.95rem',
              color: hovered ? 'var(--accent-red)' : 'var(--text-primary)',
              transition: '200ms ease'
            }}>
              {formatRupiah(product.price_1ml)}
              <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ml</span>
            </div>
          </div>
          <span style={{
            fontSize: '0.68rem', padding: '4px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-muted)'
          }}>{product.longevity_display}</span>
        </div>
      </div>
    </Link>
  )
}

const SkeletonCard = () => (
  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
    <div className="skeleton" style={{ height: 200 }} />
    <div style={{ padding: '16px 18px 18px' }}>
      <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 18, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '60%', marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 1, marginBottom: 12 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 20, width: '45%' }} />
        <div className="skeleton" style={{ height: 24, width: '30%', borderRadius: 20 }} />
      </div>
    </div>
  </div>
)

export default function CatalogPage() {
  const [searchParams] = useSearchParams()
  const { query, setQuery } = useSearchStore()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [headerRef, headerInView] = useInView()

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || query || '',
    gender: '', concentration: '',
    sort: searchParams.get('sort') || ''
  })

  useEffect(() => {
    if (query) {
      setFilters(prev => ({ ...prev, search: query }))
      setPage(1)
      setQuery('')
    }
  }, [query])

  useEffect(() => { fetchProducts() }, [page, filters])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.gender) params.set('gender', filters.gender)
      if (filters.concentration) params.set('concentration', filters.concentration)
      if (filters.sort) params.set('sort', filters.sort)
      params.set('page', page)
      params.set('limit', 12)
      const res = await api.get(`/products?${params}`)
      setProducts(res.data.products)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch { toast.error('Gagal memuat produk') }
    finally { setLoading(false) }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', gender: '', concentration: '', sort: '' })
    setPage(1)
  }

  const hasFilters = filters.gender || filters.concentration || filters.sort || filters.search
  const activeFilterCount = [filters.gender, filters.concentration, filters.sort].filter(Boolean).length

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 32px' }}>

        {/* Header */}
        <div ref={headerRef} style={{
          marginBottom: 48,
          opacity: headerInView ? 1 : 0,
          transform: headerInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease'
        }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 12
          }}>
            Koleksi Lengkap
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400, fontStyle: 'italic',
              lineHeight: 1.1
            }}>
              Katalog Parfum
            </h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{total}</span> produk
              {filters.search && <span> · "<span style={{ color: 'var(--accent-red)' }}>{filters.search}</span>"</span>}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 40,
          flexWrap: 'wrap', alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{
            flex: 1, minWidth: 240,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '11px 16px',
            transition: 'border-color 0.2s ease'
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(200,16,46,0.4)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
          >
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text" placeholder="Cari parfum, brand, aroma..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '0.88rem',
                fontFamily: 'var(--font-sans)'
              }}
            />
            {filters.search && (
              <button onClick={() => handleFilterChange('search', '')}
                style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters */}
          {[
            {
              key: 'gender', label: 'Gender',
              options: [
                { value: '', label: 'Semua Gender' },
                { value: 'Male', label: 'Pria' },
                { value: 'Female', label: 'Wanita' },
                { value: 'Unisex', label: 'Unisex' }
              ]
            },
            {
              key: 'concentration', label: 'Tipe',
              options: [
                { value: '', label: 'Semua Tipe' },
                { value: 'EDP', label: 'EDP' },
                { value: 'Extrait', label: 'Extrait' },
                { value: 'EDT', label: 'EDT' }
              ]
            },
            {
              key: 'sort', label: 'Urutkan',
              options: [
                { value: '', label: 'Terbaru' },
                { value: 'terlaris', label: 'Terlaris' },
                { value: 'termurah', label: 'Termurah' },
                { value: 'termahal', label: 'Termahal' }
              ]
            }
          ].map(({ key, label, options }) => (
            <div key={key} style={{ position: 'relative' }}>
              <select
                value={filters[key]}
                onChange={e => handleFilterChange(key, e.target.value)}
                style={{
                  padding: '11px 36px 11px 14px',
                  background: filters[key] ? 'rgba(200,16,46,0.08)' : 'var(--bg-card)',
                  border: `1px solid ${filters[key] ? 'rgba(200,16,46,0.3)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: filters[key] ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.85rem', cursor: 'pointer',
                  outline: 'none', appearance: 'none',
                  fontFamily: 'var(--font-sans)'
                }}>
                {options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none'
              }} />
            </div>
          ))}

          {/* Clear */}
          {hasFilters && (
            <button onClick={clearFilters} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '11px 16px',
              background: 'rgba(200,16,46,0.08)',
              border: '1px solid rgba(200,16,46,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-red)', fontSize: '0.85rem',
              fontWeight: 500, cursor: 'pointer'
            }}>
              <X size={14} /> Reset
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '100px 0',
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔍</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 12 }}>
              Produk tidak ditemukan
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Coba ubah filter atau kata kunci pencarian
            </p>
            <button onClick={clearFilters} style={{
              padding: '12px 28px',
              background: 'var(--accent-red)', color: 'white',
              borderRadius: 'var(--radius-full)', fontWeight: 600,
              border: 'none', cursor: 'pointer'
            }}>Reset Filter</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {products.map((product, i) => (
              <ProductCard key={product.product_id} product={product} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', gap: 8, marginTop: 64
          }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem', fontWeight: 500
              }}>← Prev</button>

            <div style={{ display: 'flex', gap: 6 }}>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <button key={i} onClick={() => setPage(pageNum)}
                    style={{
                      width: 40, height: 40,
                      background: page === pageNum
                        ? 'linear-gradient(135deg, var(--accent-red), #e11d48)'
                        : 'var(--bg-card)',
                      border: `1px solid ${page === pageNum ? 'transparent' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: page === pageNum ? 'white' : 'var(--text-secondary)',
                      fontWeight: page === pageNum ? 700 : 400,
                      cursor: 'pointer', fontSize: '0.88rem',
                      boxShadow: page === pageNum ? '0 4px 16px rgba(200,16,46,0.3)' : 'none'
                    }}>
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem', fontWeight: 500
              }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}