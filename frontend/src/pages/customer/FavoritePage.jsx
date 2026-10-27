import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import useCartStore from '../../store/cartStore'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:5000'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export default function FavoritePage() {
  const navigate = useNavigate()
  const { incrementCart } = useCartStore()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(null)

  useEffect(() => { fetchFavorites() }, [])

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites')
      setFavorites(res.data.favorites)
    } catch { toast.error('Gagal memuat favorit') }
    finally { setLoading(false) }
  }

  const handleRemoveFavorite = async (productId) => {
    try {
      await api.post('/favorites/toggle', { product_id: productId })
      setFavorites(prev => prev.filter(f => f.product_id !== productId))
      toast.success('Dihapus dari favorit')
    } catch { toast.error('Gagal menghapus favorit') }
  }

  const handleAddToCart = async (product) => {
    setAddingToCart(product.product_id)
    try {
      await api.post('/cart', { product_id: product.product_id, size_ml: 1, quantity: 1 })
      incrementCart()
      toast.success('Ditambahkan ke keranjang!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) return (
    <div style={{
      paddingTop: 'var(--navbar-height)', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid var(--border-default)',
        borderTopColor: 'var(--accent-red)',
        animation: 'rotate-slow 0.8s linear infinite'
      }} />
    </div>
  )

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .fav-outer-pad { padding: 24px 16px !important; }
          .fav-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      <div className="fav-outer-pad" style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 32px' }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 10
          }}>Koleksi Saya</div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase'
          }}>
            FAVORIT SAYA
            {favorites.length > 0 && (
              <span style={{
                marginLeft: 16, fontSize: '1rem',
                fontWeight: 700, color: 'var(--text-muted)'
              }}>({favorites.length})</span>
            )}
          </h1>
        </div>

        {favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', animation: 'fadeInUp 0.5s ease' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Heart size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{
              fontSize: '1.2rem', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 10
            }}>BELUM ADA FAVORIT</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 32 }}>
              Simpan parfum favoritmu agar mudah ditemukan
            </p>
            <button onClick={() => navigate('/catalog')}
              style={{
                padding: '14px 32px',
                background: 'var(--accent-red)', color: 'white',
                borderRadius: 'var(--radius-sm)', fontWeight: 800,
                fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(240,46,41,0.35)'
              }}>
              JELAJAHI KATALOG
            </button>
          </div>
        ) : (
          <div className="fav-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20
          }}>
            {favorites.map((fav, i) => {
              const product = fav.product
              return (
                <div key={fav.favorite_id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  animation: `fadeInUp 0.4s ease ${i * 0.06}s both`,
                  transition: 'border-color 0.2s ease'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(240,46,41,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                >
                  {/* Image */}
                  <div style={{
  		    height: 180,
  		    background: 'var(--bg-elevated)',
  		    display: 'flex', alignItems: 'center', justifyContent: 'center',
  		    position: 'relative', cursor: 'pointer',
  		    overflow: 'hidden'
		  }}
                    onClick={() => navigate(`/product/${product.product_id}`)}
                  >
                    {product.image_filename && product.image_filename !== 'default.png' ? (
		      <img
      			src={`${API_URL}/uploads/products/${product.image_filename}`}
      			alt={product.product_name}
      			style={{
        		  maxHeight: '85%', maxWidth: '85%',
        		  objectFit: 'contain',
        		  transition: 'transform 0.3s ease'
      			}}
      			onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      			onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    		      />
		  ) : (
		    <div style={{ fontSize: '3.5rem', animation: 'float 4s ease-in-out infinite' }}>
      		      🧴
    		    </div>
		  )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(product.product_id) }}
                      style={{
                        position: 'absolute', top: 12, right: 12,
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#ef4444'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                        e.currentTarget.style.color = '#ef4444'
                      }}>
                      <Heart size={14} fill="currentColor" />
                    </button>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{
                      fontSize: '0.62rem', fontWeight: 800,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--accent-red)', marginBottom: 4
                    }}>{product.brand}</div>
                    <div
                      onClick={() => navigate(`/product/${product.product_id}`)}
                      style={{
                        fontWeight: 700, fontSize: '0.9rem',
                        marginBottom: 4, letterSpacing: '-0.01em',
                        cursor: 'pointer', transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    >
                      {product.product_name}
                    </div>
                    <div style={{
                      fontSize: '0.74rem', color: 'var(--text-muted)',
                      marginBottom: 14, fontWeight: 500
                    }}>
                      {product.concentration} · {product.gender}
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12, borderTop: '1px solid var(--border-default)'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '0.62rem', fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: 'var(--text-muted)', marginBottom: 2
                        }}>MULAI</div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                          {formatRupiah(product.price_1ml)}
                          <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ml</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={addingToCart === product.product_id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px',
                          background: addingToCart === product.product_id ? 'var(--border-hover)' : 'var(--accent-red)',
                          color: 'white', fontWeight: 800,
                          fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                          borderRadius: 'var(--radius-sm)', border: 'none',
                          cursor: addingToCart === product.product_id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                        <ShoppingCart size={12} />
                        {addingToCart === product.product_id ? '...' : 'TAMBAH'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}