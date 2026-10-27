import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Heart, Share2 } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const API_URL = 'http://localhost:5000'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { incrementCart } = useCartStore()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)

  const sizes = [
    { ml: 1, key: 'price_1ml', stockKey: 'stock_1ml' },
    { ml: 2, key: 'price_2ml', stockKey: 'stock_2ml' },
    { ml: 3, key: 'price_3ml', stockKey: 'stock_3ml' },
    { ml: 5, key: 'price_5ml', stockKey: 'stock_5ml' }
  ]

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    setLoading(true)
    setVisible(false)
    try {
      const [productRes, reviewRes, similarRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/reviews/product/${id}`),
        api.get(`/recommendations/similar/${id}`)
      ])
      setProduct(productRes.data.product)
      setReviews(reviewRes.data.reviews || [])
      setSimilar(similarRes.data.products || [])
      setTimeout(() => setVisible(true), 100)

      if (isAuthenticated) {
        try {
          const [favRes, canReviewRes] = await Promise.all([
            api.get(`/favorites/check/${id}`),
            api.get(`/reviews/can-review/${id}`)
          ])
          setIsFavorite(favRes.data.is_favorite)
          setCanReview(canReviewRes.data.can_review)
          setHasReviewed(canReviewRes.data.has_reviewed)
        } catch {}
      }
    } catch {
      toast.error('Produk tidak ditemukan')
      navigate('/catalog')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Login dulu untuk menambahkan ke keranjang')
      navigate('/login')
      return
    }
    setAddingToCart(true)
    try {
      await api.post('/cart', { product_id: product.product_id, size_ml: selectedSize, quantity })
      incrementCart()
      toast.success('Berhasil ditambahkan ke keranjang!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan ke keranjang')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) { toast.error('Login dulu'); navigate('/login'); return }
    setFavoriteLoading(true)
    try {
      const res = await api.post('/favorites/toggle', { product_id: product.product_id })
      setIsFavorite(res.data.is_favorite)
      toast.success(res.data.is_favorite ? 'Ditambahkan ke favorit!' : 'Dihapus dari favorit')
    } catch { toast.error('Gagal') }
    finally { setFavoriteLoading(false) }
  }

  const handleShare = async () => {
    const shareData = {
      title: `${product.brand} - ${product.product_name}`,
      text: `Cek parfum ini di Decant Temcy! ${product.product_name} mulai dari ${formatRupiah(currentPrice)}/ml`,
      url: window.location.href
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link berhasil disalin!')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link berhasil disalin!')
      }
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Login dulu'); return }
    setSubmittingReview(true)
    try {
      await api.post('/reviews', { product_id: product.product_id, ...reviewForm })
      toast.success('Ulasan berhasil ditambahkan!')
      setReviewForm({ rating: 5, comment: '' })
      setCanReview(false)
      setHasReviewed(true)
      const res = await api.get(`/reviews/product/${id}`)
      setReviews(res.data.reviews || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulasan')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return (
    <div style={{
      paddingTop: 'var(--navbar-height)', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid var(--border-default)',
          borderTopColor: 'var(--accent-red)',
          animation: 'rotate-slow 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em' }}>
          MEMUAT...
        </p>
      </div>
    </div>
  )

  if (!product) return null

  const currentPrice = product[sizes.find(s => s.ml === selectedSize)?.key] || 0
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const hasNotes = !!(product.top_notes || product.middle_notes || product.base_notes)
  const hasProscons = !!(product.pros || product.cons)
  const hasInfoSection = hasNotes || hasProscons

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .pd-outer-pad { padding: 24px 16px !important; }
          .pd-main-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .pd-info-section-grid { grid-template-columns: 1fr !important; }
          .pd-reviews-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .pd-buy-not-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        }
      `}</style>
      <div className="pd-outer-pad" style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 32px' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: 'var(--text-muted)', marginBottom: 40,
          fontSize: '0.72rem', fontWeight: 800,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'color 0.2s ease',
          background: 'none', border: 'none'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} /> KEMBALI
        </button>

        {/* Main Grid */}
        <div className="pd-main-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 64, marginBottom: 48,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease'
        }}>
          {/* Left — Image */}
          <div style={{
            transform: visible ? 'translateX(0)' : 'translateX(-30px)',
            transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1) 0.1s'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              height: 440,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', marginBottom: 16
            }}>
              <div style={{
                position: 'absolute', width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(240,46,41,0.08) 0%, transparent 70%)',
                animation: 'float 5s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                border: '1px solid rgba(240,46,41,0.06)',
                animation: 'rotate-slow 20s linear infinite'
              }} />

              {product.image_filename && product.image_filename !== 'default.png' ? (
                <img
                  src={`${API_URL}/uploads/products/${product.image_filename}`}
                  alt={product.product_name}
                  style={{
                    maxHeight: '85%', maxWidth: '85%',
                    objectFit: 'contain', position: 'relative', zIndex: 1,
                    filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))',
                    animation: 'float 4s ease-in-out infinite'
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '8rem', position: 'relative', zIndex: 1,
                  animation: 'float 4s ease-in-out infinite'
                }}>🧴</div>
              )}

              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(6,6,10,0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs)',
                padding: '5px 12px',
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--accent-red)'
              }}>{product.brand}</div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[product.concentration, product.gender, product.longevity_display].filter(Boolean).map((tag, i) => (
                <span key={i} style={{
                  padding: '5px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600
                }}>{tag}</span>
              ))}
              {avgRating && (
                <span style={{
                  padding: '5px 12px',
                  background: 'rgba(240,46,41,0.06)',
                  border: '1px solid rgba(240,46,41,0.15)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem', color: 'var(--accent-red)',
                  fontWeight: 800, letterSpacing: '0.04em'
                }}>⭐ {avgRating} ({reviews.length})</span>
              )}
            </div>
          </div>

          {/* Right — Info */}
          <div style={{
            transform: visible ? 'translateX(0)' : 'translateX(30px)',
            transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1) 0.2s'
          }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--accent-red)', marginBottom: 10
            }}>{product.brand}</div>

            <h1 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 900, letterSpacing: '-0.03em',
              textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 14
            }}>{product.product_name}</h1>

            {product.inspirator && (
              <p style={{
                fontSize: '0.78rem', color: 'var(--text-muted)',
                marginBottom: 18, fontWeight: 500
              }}>
                Inspirasi: <span style={{ color: 'var(--text-secondary)' }}>{product.inspirator}</span>
              </p>
            )}

            {product.description && (
              <p style={{
                color: 'var(--text-secondary)', lineHeight: 1.9,
                marginBottom: 28, fontSize: '0.88rem', fontWeight: 400,
                borderLeft: '2px solid rgba(240,46,41,0.3)',
                paddingLeft: 16
              }}>{product.description}</p>
            )}

            {/* Size Selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 12
              }}>PILIH UKURAN</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sizes.map(({ ml, key, stockKey }) => {
                  if (!product[key]) return null
                  const stock = product[stockKey] ?? 0
                  const isHabis = stock === 0
                  const isSelected = selectedSize === ml
                  return (
                    <button key={ml}
                      onClick={() => { if (!isHabis) { setSelectedSize(ml); setQuantity(1) } }}
                      disabled={isHabis}
                      style={{
                        padding: '10px 16px',
                        background: isHabis
                          ? 'var(--bg-card)'
                          : isSelected
                            ? 'linear-gradient(135deg, var(--accent-red), #e11d18)'
                            : 'var(--bg-elevated)',
                        border: `1px solid ${isSelected && !isHabis ? 'transparent' : isHabis ? 'var(--border-default)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: isHabis ? 'var(--text-muted)' : isSelected ? 'white' : 'var(--text-secondary)',
                        fontWeight: 800,
                        cursor: isHabis ? 'not-allowed' : 'pointer',
                        fontSize: '0.72rem', letterSpacing: '0.06em',
                        boxShadow: isSelected && !isHabis ? '0 4px 14px rgba(240,46,41,0.3)' : 'none',
                        transition: 'all 0.2s ease',
                        opacity: isHabis ? 0.5 : 1,
                        position: 'relative'
                      }}>
                      {ml}ml
                      <div style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85, marginTop: 2 }}>
                        {formatRupiah(product[key])}
                      </div>
                      <div style={{
                        fontSize: '0.58rem', fontWeight: 700, marginTop: 3,
                        color: isHabis
                          ? '#ef4444'
                          : isSelected
                            ? 'rgba(255,255,255,0.75)'
                            : stock <= 5
                              ? '#f59e0b'
                              : 'var(--text-muted)'
                      }}>
                        {isHabis ? 'HABIS' : `Stok: ${stock}`}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 6
              }}>HARGA</div>
              <div style={{
                fontSize: '2rem', fontWeight: 900,
                letterSpacing: '-0.03em', color: 'var(--accent-red)'
              }}>{formatRupiah(currentPrice)}</div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 12
              }}>JUMLAH</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    width: 40, height: 40,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                    color: 'var(--text-primary)', fontSize: '1.1rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>−</button>
                <div style={{
                  width: 56, height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderLeft: 'none', borderRight: 'none',
                  fontWeight: 800, fontSize: '0.95rem'
                }}>{quantity}</div>
                <button
                  onClick={() => {
                    const selectedStockKey = sizes.find(s => s.ml === selectedSize)?.stockKey
                    const availableStock = selectedStockKey ? (product[selectedStockKey] ?? 0) : 0
                    if (quantity < availableStock) setQuantity(q => q + 1)
                    else toast.error(`Stok tidak mencukupi. Stok tersedia: ${availableStock} pcs`)
                  }}
                  style={{
                    width: 40, height: 40,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    color: 'var(--text-primary)', fontSize: '1.1rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleAddToCart} disabled={addingToCart}
                style={{
                  width: '100%', padding: '15px',
                  background: addingToCart ? 'var(--border-hover)' : 'var(--accent-red)',
                  color: 'white', fontWeight: 800, fontSize: '0.78rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  border: 'none', cursor: addingToCart ? 'not-allowed' : 'pointer',
                  boxShadow: addingToCart ? 'none' : '0 4px 20px rgba(240,46,41,0.35)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  if (!addingToCart) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(240,46,41,0.45)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = addingToCart ? 'none' : '0 4px 20px rgba(240,46,41,0.35)'
                }}>
                <ShoppingCart size={16} />
                {addingToCart ? 'MENAMBAHKAN...' : 'TAMBAH KE KERANJANG'}
              </button>

              <button onClick={handleToggleFavorite} disabled={favoriteLoading}
                style={{
                  width: '100%', padding: '13px',
                  background: isFavorite ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isFavorite ? 'rgba(239,68,68,0.3)' : 'var(--border-default)'}`,
                  color: isFavorite ? '#ef4444' : 'var(--text-secondary)',
                  fontWeight: 800, fontSize: '0.72rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)',
                  cursor: favoriteLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s ease'
                }}>
                <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
                {isFavorite ? 'TERSIMPAN DI FAVORIT' : 'SIMPAN KE FAVORIT'}
              </button>

              <button onClick={handleShare}
                style={{
                  width: '100%', padding: '13px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontWeight: 800, fontSize: '0.72rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}>
                <Share2 size={15} /> BAGIKAN PRODUK
              </button>
            </div>
          </div>
        </div>

        {/* Notes + Pros/Cons */}
        {hasInfoSection && (
          <div className="pd-info-section-grid" style={{
            display: 'grid',
            gridTemplateColumns: hasNotes && hasProscons ? '1fr 1fr' : '1fr',
            gap: 20, marginBottom: 24
          }}>
            {hasNotes && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: 28
              }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--accent-red)', marginBottom: 20
                }}>PIRAMIDA WANGI</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'TOP NOTES', notes: product.top_notes, icon: '🍃' },
                    { label: 'MIDDLE NOTES', notes: product.middle_notes, icon: '🌸' },
                    { label: 'BASE NOTES', notes: product.base_notes, icon: '🪵' }
                  ].filter(n => n.notes).map(({ label, notes, icon }) => (
                    <div key={label} style={{
                      padding: '12px 14px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: '0.85rem' }}>{icon}</span>
                        <span style={{
                          fontSize: '0.58rem', fontWeight: 800,
                          letterSpacing: '0.15em', textTransform: 'uppercase',
                          color: 'var(--accent-red)'
                        }}>{label}</span>
                      </div>
                      <p style={{
                        fontSize: '0.82rem', color: 'var(--text-secondary)',
                        lineHeight: 1.6, fontWeight: 400
                      }}>{notes}</p>
                    </div>
                  ))}
                </div>

                {product.main_accords && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{
                      fontSize: '0.58rem', fontWeight: 800,
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: 'var(--text-muted)', marginBottom: 10
                    }}>MAIN ACCORDS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {product.main_accords.split(',').map((accord, i) => (
                        <span key={i} style={{
                          padding: '4px 10px',
                          background: 'rgba(240,46,41,0.08)',
                          border: '1px solid rgba(240,46,41,0.15)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.72rem', fontWeight: 700,
                          color: 'var(--accent-red)'
                        }}>{accord.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasProscons && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {product.pros && (
                  <div style={{
                    flex: 1, padding: 22,
                    background: 'rgba(34,197,94,0.04)',
                    border: '1px solid rgba(34,197,94,0.12)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{
                      fontSize: '0.62rem', fontWeight: 800,
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: '#22c55e', marginBottom: 10
                    }}>KELEBIHAN</div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.85rem', fontWeight: 400 }}>
                      {product.pros}
                    </p>
                  </div>
                )}
                {product.cons && (
                  <div style={{
                    flex: 1, padding: 22,
                    background: 'rgba(239,68,68,0.04)',
                    border: '1px solid rgba(239,68,68,0.12)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{
                      fontSize: '0.62rem', fontWeight: 800,
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: '#ef4444', marginBottom: 10
                    }}>KEKURANGAN</div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.85rem', fontWeight: 400 }}>
                      {product.cons}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: 36, marginBottom: 48
        }}>
          <div className="pd-reviews-header" style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 28
          }}>
            <div>
              <div style={{
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--accent-red)', marginBottom: 8
              }}>ULASAN PELANGGAN</div>
              <h2 style={{
                fontSize: '1.4rem', fontWeight: 900,
                letterSpacing: '-0.02em', textTransform: 'uppercase'
              }}>{reviews.length} ULASAN</h2>
            </div>
            {avgRating && (
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '2.8rem', fontWeight: 900,
                  color: 'var(--accent-red)', letterSpacing: '-0.04em', lineHeight: 1
                }}>{avgRating}</div>
                <div style={{
                  fontSize: '0.62rem', color: 'var(--text-muted)',
                  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
                }}>DARI 5.0</div>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            hasReviewed ? (
              <div style={{
                padding: '16px 20px', marginBottom: 28,
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#22c55e', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 600 }}>
                  Kamu sudah memberikan ulasan untuk produk ini
                </span>
              </div>
            ) : canReview ? (
              <form onSubmit={handleSubmitReview} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', padding: 22, marginBottom: 28
              }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 14
                }}>TULIS ULASAN</div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      style={{
                        fontSize: '1.3rem', cursor: 'pointer',
                        opacity: star <= reviewForm.rating ? 1 : 0.25,
                        transform: star <= reviewForm.rating ? 'scale(1.15)' : 'scale(1)',
                        transition: '150ms ease', background: 'none', border: 'none'
                      }}>⭐</button>
                  ))}
                  <span style={{
                    marginLeft: 8, fontSize: '0.75rem',
                    color: 'var(--text-muted)', fontWeight: 600, alignSelf: 'center'
                  }}>{reviewForm.rating}/5</span>
                </div>

                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Bagikan pengalaman kamu dengan parfum ini..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)', fontSize: '0.85rem',
                    resize: 'vertical', outline: 'none', marginBottom: 12,
                    fontFamily: 'var(--font-sans)', lineHeight: 1.6, fontWeight: 400
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
                <button type="submit" disabled={submittingReview}
                  style={{
                    padding: '10px 24px',
                    background: submittingReview ? 'var(--border-hover)' : 'var(--accent-red)',
                    color: 'white', fontWeight: 800,
                    borderRadius: 'var(--radius-sm)', border: 'none',
                    cursor: submittingReview ? 'not-allowed' : 'pointer',
                    fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    boxShadow: submittingReview ? 'none' : '0 4px 12px rgba(240,46,41,0.3)'
                  }}>
                  {submittingReview ? 'MENGIRIM...' : 'KIRIM ULASAN'}
                </button>
              </form>
            ) : (
              <div className="pd-buy-not-header" style={{
                padding: '16px 20px', marginBottom: 28,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Beli produk ini terlebih dahulu untuk memberikan ulasan
                </span>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  style={{
                    padding: '8px 16px', flexShrink: 0,
                    background: 'var(--accent-red)', color: 'white',
                    borderRadius: 'var(--radius-sm)', fontWeight: 800,
                    fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: 'none', cursor: 'pointer'
                  }}>
                  BELI SEKARANG
                </button>
              </div>
            )
          ) : (
            <div className="pd-buy-not-header" style={{
              padding: '18px 20px', marginBottom: 28,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Login untuk menulis ulasan
              </span>
              <button onClick={() => navigate('/login')}
                style={{
                  padding: '8px 18px',
                  background: 'var(--accent-red)', color: 'white',
                  borderRadius: 'var(--radius-sm)', fontWeight: 800,
                  fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  border: 'none', cursor: 'pointer'
                }}>
                MASUK
              </button>
            </div>
          )}

          {/* List reviews */}
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Belum ada ulasan. Jadilah yang pertama!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {reviews.map(review => (
                <div key={review.review_id} style={{
                  padding: '18px 20px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)'
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-red), #A2120E)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 800, color: 'white', flexShrink: 0
                      }}>
                        {review.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {review.user?.full_name || 'Anonymous'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {new Date(review.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} style={{ fontSize: '0.82rem', opacity: s <= review.rating ? 1 : 0.15 }}>⭐</span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, fontWeight: 400 }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produk Serupa */}
        {similar.length > 0 && (
          <div>
            <div style={{
              fontSize: '0.62rem', fontWeight: 800,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--accent-red)', marginBottom: 10
            }}>MUNGKIN KAMU SUKA</div>
            <h2 style={{
              fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
              fontWeight: 900, letterSpacing: '-0.03em',
              textTransform: 'uppercase', marginBottom: 28
            }}>PRODUK SERUPA</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16
            }}>
              {similar.map((p, i) => (
                <div key={p.product_id}
                  onClick={() => navigate(`/product/${p.product_id}`)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden', cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    animation: `fadeInUp 0.5s ease ${i * 0.08}s both`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(240,46,41,0.3)'
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-default)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}>
                  <div style={{
                    height: 140, background: 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {p.image_filename && p.image_filename !== 'default.png' ? (
                      <img
                        src={`${API_URL}/uploads/products/${p.image_filename}`}
                        alt={p.product_name}
                        style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: '2.5rem' }}>🧴</span>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{
                      fontSize: '0.58rem', fontWeight: 800,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--accent-red)', marginBottom: 4
                    }}>{p.brand}</div>
                    <div style={{
                      fontWeight: 700, fontSize: '0.82rem',
                      marginBottom: 8, letterSpacing: '-0.01em'
                    }}>{p.product_name}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                      {formatRupiah(p.price_1ml)}
                      <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ml</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}