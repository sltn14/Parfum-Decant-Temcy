import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react'
import api from '../../api/axios'
import useCartStore from '../../store/cartStore'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const API_URL = 'http://localhost:5000'

export default function CartPage() {
  const navigate = useNavigate()
  const { setCartCount } = useCartStore()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCart() }, [])

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart')
      setCart(res.data.cart)
      setCartCount(res.data.cart?.items?.length || 0)
    } catch {
      toast.error('Gagal memuat keranjang')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) { handleRemove(itemId); return }

    const cartItem = cart?.items?.find(i => i.cart_item_id === itemId)
    if (cartItem?.product) {
      const stockKey = `stock_${cartItem.size_ml}ml`
      const availableStock = cartItem.product[stockKey] ?? 0
      if (quantity > availableStock) {
        toast.error(`Stok tidak mencukupi. Stok tersedia: ${availableStock} pcs`)
        return
      }
    }

    const prevCart = cart

    setCart(prev => ({
      ...prev,
      items: prev.items.map(i =>
        i.cart_item_id === itemId ? { ...i, quantity } : i
      )
    }))

    try {
      await api.put(`/cart/${itemId}`, { quantity })
    } catch (err) {
      setCart(prevCart)
      const msg = err?.response?.data?.message || 'Gagal update keranjang'
      toast.error(msg)
    }
  }

  const handleRemove = async (itemId) => {
    setCart(prev => ({ ...prev, items: prev.items.filter(item => item.cart_item_id !== itemId) }))
    setCartCount(prev => Math.max(0, prev - 1))
    try {
      await api.delete(`/cart/${itemId}`)
      toast.success('Item dihapus')
    } catch {
      toast.error('Gagal menghapus item')
      fetchCart()
    }
  }

  const total = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
  const totalItems = cart?.items?.length || 0

  if (loading) return (
    <div style={{
      paddingTop: 'var(--navbar-height)', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '2px solid var(--border-default)',
          borderTopColor: 'var(--accent-red)',
          animation: 'rotate-slow 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.1em' }}>
          MEMUAT KERANJANG...
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .cart-main-grid {
            grid-template-columns: 1fr !important;
          }
          .cart-summary {
            position: static !important;
          }
          .cart-outer-pad {
            padding: 24px 16px !important;
          }
          .cart-item-row {
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .cart-item-info {
            flex: 1 1 calc(100% - 88px) !important;
          }
          .cart-item-controls {
            order: 3;
          }
          .cart-item-subtotal {
            order: 4;
            min-width: auto !important;
            flex: 1 !important;
          }
          .cart-item-delete {
            order: 2;
          }
        }
      `}</style>
      <div className="cart-outer-pad" style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 32px' }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 10
          }}>Keranjang</div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase'
          }}>
            KERANJANG BELANJA
            {totalItems > 0 && (
              <span style={{ marginLeft: 16, fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                ({totalItems} item)
              </span>
            )}
          </h1>
        </div>

        {totalItems === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', animation: 'fadeInUp 0.5s ease' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: '2rem'
            }}>🛒</div>
            <h3 style={{
              fontSize: '1.2rem', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 10
            }}>KERANJANG KOSONG</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 32, fontWeight: 400 }}>
              Belum ada produk di keranjang kamu
            </p>
            <Link to="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 32px',
              background: 'var(--accent-red)', color: 'white',
              borderRadius: 'var(--radius-sm)', fontWeight: 800,
              fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(240,46,41,0.35)', textDecoration: 'none'
            }}>
              <ShoppingBag size={16} /> MULAI BELANJA
            </Link>
          </div>
        ) : (
          <div className="cart-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.items.map((item, i) => (
                <div key={item.cart_item_id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  display: 'flex', gap: 20, alignItems: 'center',
                  animation: `fadeInUp 0.4s ease ${i * 0.06}s both`,
                  transition: 'border-color 0.2s ease'
                }}
                  className="cart-item-row"
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                >
                  <Link to={`/product/${item.product_id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                    <div style={{
                      width: 72, height: 72,
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border-default)',
                      overflow: 'hidden', cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {item.product?.image_filename && item.product.image_filename !== 'default.png' ? (
                        <img
                          src={`${API_URL}/uploads/products/${item.product.image_filename}`}
                          alt={item.product?.product_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.8rem' }}>🧴</span>
                      )}
                    </div>
                  </Link>

                  <div className="cart-item-info" style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.62rem', fontWeight: 800,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--accent-red)', marginBottom: 4
                    }}>{item.product?.brand}</div>
                    <Link to={`/product/${item.product_id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        fontWeight: 700, fontSize: '0.9rem',
                        marginBottom: 4, letterSpacing: '-0.01em',
                        color: 'var(--text-primary)', transition: 'color 0.2s ease'
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                      >{item.product?.product_name}</div>
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {item.size_ml}ml · {formatRupiah(item.price)}/botol
                    </div>
                  </div>

                  <div className="cart-item-controls" style={{
                    display: 'flex', alignItems: 'center',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)', overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}
                      style={{
                        width: 34, height: 34,
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease', border: 'none'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent-red)'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-elevated)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}>
                      <Minus size={12} />
                    </button>
                    <div style={{
                      width: 40, height: 34,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.88rem',
                      background: 'var(--bg-card)',
                      borderLeft: '1px solid var(--border-default)',
                      borderRight: '1px solid var(--border-default)'
                    }}>{item.quantity}</div>
                    <button
                      onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}
                      style={{
                        width: 34, height: 34,
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease', border: 'none'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent-red)'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-elevated)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }}>
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="cart-item-subtotal" style={{ minWidth: 110, textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.62rem', fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--text-muted)', marginBottom: 3
                    }}>SUBTOTAL</div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>

                  <button className="cart-item-delete" onClick={() => handleRemove(item.cart_item_id)}
                    style={{
                      width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      color: '#ef4444', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease', flexShrink: 0
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ef4444'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                      e.currentTarget.style.color = '#ef4444'
                    }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <Link to="/catalog" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 0', marginTop: 8,
                fontSize: '0.72rem', fontWeight: 800,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--text-muted)', textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ← LANJUT BELANJA
              </Link>
            </div>

            <div className="cart-summary" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 28,
              height: 'fit-content',
              position: 'sticky', top: 'calc(var(--navbar-height) + 24px)'
            }}>
              <h2 style={{
                fontSize: '0.72rem', fontWeight: 800,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 24
              }}>RINGKASAN PESANAN</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {cart.items.map(item => (
                  <div key={item.cart_item_id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.82rem', gap: 10
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, flex: 1 }}>
                      {item.product?.product_name} ({item.size_ml}ml) ×{item.quantity}
                    </span>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)',
                marginBottom: 20
              }} />

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-end', marginBottom: 28
              }}>
                <div>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 800,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', marginBottom: 4
                  }}>TOTAL</div>
                  <div style={{
                    fontSize: '1.5rem', fontWeight: 900,
                    color: 'var(--accent-red)', letterSpacing: '-0.02em'
                  }}>
                    {formatRupiah(total)}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {totalItems} produk
                </div>
              </div>

              <button onClick={() => navigate('/checkout')}
                style={{
                  width: '100%', padding: '15px',
                  background: 'var(--accent-red)', color: 'white',
                  fontWeight: 800, fontSize: '0.78rem',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 20px rgba(240,46,41,0.35)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(240,46,41,0.45)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(240,46,41,0.35)'
                }}>
                CHECKOUT <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}