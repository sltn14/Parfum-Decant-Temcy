import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import toast from 'react-hot-toast'

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

  const [infoRef, infoInView] = useInView()
  const [reviewRef, reviewInView] = useInView()

  const sizes = [
    { ml: 1, key: 'price_1ml' },
    { ml: 2, key: 'price_2ml' },
    { ml: 3, key: 'price_3ml' },
    { ml: 5, key: 'price_5ml' }
  ]

  useEffect(() => {
    fetchAll()
  }, [id])

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
      setReviews(reviewRes.data.reviews)
      setSimilar(similarRes.data.products)
      setTimeout(() => setVisible(true), 100)
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

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Login dulu'); return }
    setSubmittingReview(true)
    try {
      await api.post('/reviews', { product_id: product.product_id, ...reviewForm })
      toast.success('Review berhasil ditambahkan!')
      setReviewForm({ rating: 5, comment: '' })
      const res = await api.get(`/reviews/product/${id}`)
      setReviews(res.data.reviews)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal')
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
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Memuat produk...</p>
      </div>
    </div>
  )

  if (!product) return null

  const currentPrice = product[sizes.find(s => s.ml === selectedSize)?.key] || 0
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 32px' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: 'var(--text-muted)', marginBottom: 40,
          fontSize: '0.85rem', cursor: 'pointer',
          transition: 'color 0.2s ease'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <ArrowLeft size={16} /> Kembali
        </button>

        {/* Main */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 64, marginBottom: 80,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease'
        }}>

          {/* Left - Product Visual */}
          <div style={{
            transform: visible ? 'translateX(0)' : 'translateX(-30px)',
            transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1) 0.1s'
          }}>
            {/* Main Image */}
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              height: 440,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', marginBottom: 16
            }}>
              {/* Decorative circles */}
              <div style={{
                position: 'absolute', width: 300, height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)',
                animation: 'float 5s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute', width: 200, height: 200,
                borderRadius: '50%',
                border: '1px solid rgba(200,16,46,0.08)',
                animation: 'rotate-slow 20s linear infinite'
              }} />
              <div style={{
                position: 'absolute', width: 280, height: 280,
                borderRadius: '50%',
                border: '1px solid rgba(201,168,76,0.06)',
                animation: 'rotate-reverse 15s linear infinite'
              }} />

              <div style={{ fontSize: '8rem', position: 'relative', zIndex: 1, animation: 'float 4s ease-in-out infinite' }}>
                🧴
              </div>

              {/* Brand badge */}
              <div style={{
                position: 'absolute', top: 20, left: 20,
                background: 'rgba(6,6,10,0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--accent-gold)'
              }}>
                {product.brand}
              </div>
            </div>

            {/* Info Chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                product.concentration,
                product.gender,
                product.longevity_display
              ].filter(Boolean).map((tag, i) => (
                <span key={i} style={{
                  padding: '6px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem', color: 'var(--text-muted)'
                }}>{tag}</span>
              ))}
              {avgRating > 0 && (
                <span style={{
                  padding: '6px 14px',
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem', color: 'var(--accent-gold)',
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  ⭐ {avgRating} ({reviews.length})
                </span>
              )}
            </div>
          </div>

          {/* Right - Product Info */}
          <div style={{
            transform: visible ? 'translateX(0)' : 'translateX(30px)',
            transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1) 0.2s'
          }}>
            <div style={{
              fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--accent-red)', marginBottom: 12
            }}>
              {product.brand}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              fontWeight: 400, fontStyle: 'italic',
              lineHeight: 1.15, marginBottom: 16
            }}>
              {product.product_name}
            </h1>

            {product.inspirator && (
              <p style={{
                fontSize: '0.82rem', color: 'var(--text-muted)',
                marginBottom: 20, fontStyle: 'italic'
              }}>
                Terinspirasi dari: <span style={{ color: 'var(--text-secondary)' }}>{product.inspirator}</span>
              </p>
            )}

            {product.description && (
              <p style={{
                color: 'var(--text-secondary)', lineHeight: 1.9,
                marginBottom: 32, fontSize: '0.9rem',
                borderLeft: '2px solid rgba(200,16,46,0.3)',
                paddingLeft: 16
              }}>
                {product.description}
              </p>
            )}

            {/* Size Selector */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 12
              }}>Pilih Ukuran</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {sizes.map(({ ml, key }) => product[key] > 0 && (
                  <button key={ml} onClick={() => setSelectedSize(ml)}
                    style={{
                      padding: '10px 20px',
                      background: selectedSize === ml
                        ? 'linear-gradient(135deg, var(--accent-red), #e11d48)'
                        : 'var(--bg-elevated)',
                      border: `1px solid ${selectedSize === ml ? 'transparent' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: selectedSize === ml ? 'white' : 'var(--text-secondary)',
                      fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
                      boxShadow: selectedSize === ml ? '0 4px 16px rgba(200,16,46,0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                    {ml}ml
                    <div style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.8, marginTop: 2 }}>
                      {formatRupiah(product[key])}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.1em' }}>
                HARGA
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.2rem', fontWeight: 400,
                background: 'linear-gradient(135deg, var(--text-primary), var(--accent-red))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {formatRupiah(currentPrice)}
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 12
              }}>Jumlah</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    width: 40, height: 40,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                    color: 'var(--text-primary)', fontSize: '1.2rem',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>−</button>
                <div style={{
                  width: 56, height: 40, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderLeft: 'none', borderRight: 'none',
                  fontWeight: 700, fontSize: '0.95rem'
                }}>{quantity}</div>
                <button onClick={() => setQuantity(q => q + 1)}
                  style={{
                    width: 40, height: 40,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                    color: 'var(--text-primary)', fontSize: '1.2rem',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>+</button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button onClick={handleAddToCart} disabled={addingToCart}
              style={{
                width: '100%', padding: '16px',
                background: addingToCart
                  ? 'var(--border-hover)'
                  : 'linear-gradient(135deg, var(--accent-red), #e11d48)',
                color: 'white', fontWeight: 700,
                fontSize: '0.9rem', letterSpacing: '0.08em',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                border: 'none', cursor: addingToCart ? 'not-allowed' : 'pointer',
                boxShadow: addingToCart ? 'none' : '0 8px 32px rgba(200,16,46,0.35)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase'
              }}
              onMouseEnter={e => {
                if (!addingToCart) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(200,16,46,0.45)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = addingToCart ? 'none' : '0 8px 32px rgba(200,16,46,0.35)'
              }}>
              <ShoppingCart size={18} />
              {addingToCart ? 'Menambahkan...' : 'Tambah ke Keranjang'}
            </button>
          </div>
        </div>

        {/* Fragrance Pyramid */}
        <div ref={infoRef} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 24, marginBottom: 32,
          opacity: infoInView ? 1 : 0,
          transform: infoInView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.6s ease'
        }}>
          {/* Notes */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: 32
          }}>
            <div style={{
              fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--accent-red)', marginBottom: 20
            }}>Piramida Wangi</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Top Notes', notes: product.top_notes, icon: '🍃' },
                { label: 'Middle Notes', notes: product.middle_notes, icon: '🌸' },
                { label: 'Base Notes', notes: product.base_notes, icon: '🪵' }
              ].map(({ label, notes, icon }) => notes && (
                <div key={label} style={{
                  padding: '14px 16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 6
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>{icon}</span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--accent-gold)'
                    }}>{label}</span>
                  </div>
                  <p style={{
                    fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6
                  }}>{notes}</p>
                </div>
              ))}
            </div>

            {product.main_accords && (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  fontSize: '0.68rem', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 10
                }}>Main Accords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.main_accords.split(',').map((accord, i) => (
                    <span key={i} style={{
                      padding: '4px 12px',
                      background: 'rgba(200,16,46,0.08)',
                      border: '1px solid rgba(200,16,46,0.2)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem', color: 'var(--accent-red)'
                    }}>{accord.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pros & Cons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {product.pros && (
              <div style={{
                flex: 1, padding: 24,
                background: 'rgba(34,197,94,0.04)',
                border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12
                }}>
                  <span style={{ fontSize: '1rem' }}>✓</span>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: '#22c55e'
                  }}>Kelebihan</span>
                </div>
                <p style={{
                  color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.88rem'
                }}>{product.pros}</p>
              </div>
            )}
            {product.cons && (
              <div style={{
                flex: 1, padding: 24,
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12
                }}>
                  <span style={{ fontSize: '1rem' }}>✗</span>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: '#ef4444'
                  }}>Kekurangan</span>
                </div>
                <p style={{
                  color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.88rem'
                }}>{product.cons}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div ref={reviewRef} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: 40, marginBottom: 48,
          opacity: reviewInView ? 1 : 0,
          transform: reviewInView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.6s ease 0.2s'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--accent-red)', marginBottom: 8
              }}>Ulasan Pelanggan</div>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic'
              }}>
                {reviews.length} Ulasan
              </h2>
            </div>
            {avgRating > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '3rem', fontWeight: 400,
                  color: 'var(--accent-gold)'
                }}>{avgRating}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>dari 5.0</div>
              </div>
            )}
          </div>

          {/* Review Form */}
          {isAuthenticated && (
            <form onSubmit={handleSubmitReview} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: 24, marginBottom: 32
            }}>
              <div style={{
                fontSize: '0.78rem', fontWeight: 600,
                letterSpacing: '0.08em', color: 'var(--text-muted)',
                marginBottom: 14, textTransform: 'uppercase'
              }}>Tulis Ulasan</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    style={{
                      fontSize: '1.4rem', cursor: 'pointer',
                      opacity: star <= reviewForm.rating ? 1 : 0.25,
                      transition: '150ms ease',
                      transform: star <= reviewForm.rating ? 'scale(1.1)' : 'scale(1)'
                    }}>⭐</button>
                ))}
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
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)', fontSize: '0.88rem',
                  resize: 'vertical', outline: 'none', marginBottom: 14,
                  fontFamily: 'var(--font-sans)', lineHeight: 1.6
                }}
              />
              <button type="submit" disabled={submittingReview}
                style={{
                  padding: '10px 24px',
                  background: submittingReview ? 'var(--border-hover)' : 'var(--accent-red)',
                  color: 'white', fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  border: 'none', cursor: submittingReview ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem', letterSpacing: '0.04em'
                }}>
                {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </form>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: '0.9rem' }}>Belum ada ulasan. Jadilah yang pertama!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(review => (
                <div key={review.review_id} style={{
                  padding: '20px 24px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  transition: '200ms ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-red), #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700, color: 'white'
                      }}>
                        {review.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                          {review.user?.full_name || 'Anonymous'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(review.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{
                          fontSize: '0.85rem',
                          opacity: s <= review.rating ? 1 : 0.2
                        }}>⭐</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Similar Products */}
        {similar.length > 0 && (
          <div>
            <div style={{
              fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--accent-red)', marginBottom: 12
            }}>Mungkin Kamu Suka</div>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.8rem', fontWeight: 400, fontStyle: 'italic',
              marginBottom: 32
            }}>Produk Serupa</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 20
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
                    animation: `fadeInUp 0.5s ease ${i * 0.1}s both`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(200,16,46,0.3)'
                    e.currentTarget.style.transform = 'translateY(-6px)'
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
                    fontSize: '2.5rem'
                  }}>🧴</div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{
                      fontSize: '0.65rem', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--accent-gold)', marginBottom: 4
                    }}>{p.brand}</div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.92rem', fontWeight: 400,
                      marginBottom: 8, lineHeight: 1.3
                    }}>{p.product_name}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-red)' }}>
                      {formatRupiah(p.price_1ml)}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ml</span>
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