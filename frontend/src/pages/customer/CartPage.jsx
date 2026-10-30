import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Minus, Plus } from 'lucide-react'
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
      items: prev.items.map(i => i.cart_item_id === itemId ? { ...i, quantity } : i)
    }))
    try {
      await api.put(`/cart/${itemId}`, { quantity })
    } catch (err) {
      setCart(prevCart)
      toast.error(err?.response?.data?.message || 'Gagal update keranjang')
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
        .cart-page-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 48px 32px;
        }
        .cart-label-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent-red);
          margin-bottom: 10px;
        }
        .cart-h1 {
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin: 0 0 40px 0;
        }
        .cart-h1-count {
          margin-left: 16px;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .cart-main-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 32px;
          align-items: start;
        }
        .cart-items-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cart-item-row {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 20px 24px;
          display: flex;
          gap: 20px;
          align-items: center;
          transition: border-color 0.2s ease;
        }
        .cart-item-row:hover {
          border-color: var(--border-hover);
        }
        .cart-item-img {
          width: 72px;
          height: 72px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-default);
          overflow: hidden;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .cart-item-img:hover { transform: scale(1.05); }
        .cart-item-info {
          flex: 1;
          min-width: 0;
        }
        .cart-brand {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent-red);
          margin-bottom: 4px;
        }
        .cart-name {
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
          color: var(--text-primary);
          transition: color 0.2s ease;
          text-decoration: none;
          display: block;
        }
        .cart-name:hover { color: var(--accent-red); }
        .cart-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .cart-item-controls {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
        }
        .cart-ctrl-btn {
          width: 34px;
          height: 34px;
          background: var(--bg-elevated);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          border: none;
        }
        .cart-ctrl-btn:hover {
          background: var(--accent-red);
          color: white;
        }
        .cart-ctrl-qty {
          width: 40px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.88rem;
          background: var(--bg-card);
          border-left: 1px solid var(--border-default);
          border-right: 1px solid var(--border-default);
        }
        .cart-item-subtotal {
          min-width: 110px;
          text-align: right;
          flex-shrink: 0;
        }
        .cart-subtotal-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 3px;
        }
        .cart-subtotal-val {
          font-weight: 800;
          font-size: 0.95rem;
        }
        .cart-item-delete {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          color: #ef4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .cart-item-delete:hover {
          background: #ef4444;
          color: white;
        }
        .cart-continue-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          margin-top: 8px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          text-decoration: none;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          background: var(--bg-elevated);
          transition: all 0.2s ease;
        }
        .cart-continue-link:hover {
          color: var(--accent-red);
          border-color: rgba(240,46,41,0.3);
          background: rgba(240,46,41,0.04);
        }
        .cart-summary {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 28px;
          height: fit-content;
          position: sticky;
          top: calc(var(--navbar-height) + 24px);
        }
        .cart-section-title {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 24px;
        }
        .cart-summary-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          gap: 10px;
          margin-bottom: 12px;
        }
        .cart-summary-item-name {
          color: var(--text-muted);
          font-weight: 500;
          flex: 1;
        }
        .cart-summary-item-price {
          font-weight: 700;
          flex-shrink: 0;
        }
        .cart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 28px;
        }
        .cart-total-label {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .cart-total-num {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--accent-red);
          letter-spacing: -0.02em;
        }
        .cart-total-items {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .cart-checkout-btn {
          width: 100%;
          padding: 15px;
          background: var(--accent-red);
          color: white;
          font-weight: 800;
          font-size: 0.78rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: var(--radius-sm);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(240,46,41,0.35);
          transition: all 0.3s ease;
        }
        .cart-checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(240,46,41,0.45);
        }
        .cart-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 2rem;
        }
        .cart-empty-title {
          font-size: 1.2rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .cart-empty-text {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 32px;
          font-weight: 400;
        }

        /* === MOBILE === */
        @media (max-width: 768px) {
          .cart-page-wrap {
            padding: 20px 14px !important;
          }
          .cart-h1 {
            font-size: 1.25rem !important;
            margin-bottom: 20px !important;
          }
          .cart-h1-count {
            font-size: 0.75rem !important;
            margin-left: 8px !important;
          }
          .cart-main-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .cart-summary {
            position: static !important;
            padding: 16px !important;
          }
          .cart-item-row {
            padding: 12px !important;
            gap: 10px !important;
            flex-wrap: wrap !important;
          }
          .cart-item-img {
            width: 54px !important;
            height: 54px !important;
          }
          .cart-item-info {
            flex: 1 1 calc(100% - 70px) !important;
          }
          .cart-brand {
            font-size: 0.5rem !important;
          }
          .cart-name {
            font-size: 0.78rem !important;
          }
          .cart-meta {
            font-size: 0.62rem !important;
          }
          .cart-item-controls {
            order: 3 !important;
          }
          .cart-ctrl-btn {
            width: 28px !important;
            height: 28px !important;
          }
          .cart-ctrl-qty {
            width: 32px !important;
            height: 28px !important;
            font-size: 0.78rem !important;
          }
          .cart-item-subtotal {
            order: 4 !important;
            min-width: auto !important;
            flex: 1 !important;
          }
          .cart-subtotal-label {
            font-size: 0.48rem !important;
          }
          .cart-subtotal-val {
            font-size: 0.78rem !important;
          }
          .cart-item-delete {
            order: 2 !important;
            width: 28px !important;
            height: 28px !important;
          }
          .cart-section-title {
            font-size: 0.6rem !important;
            margin-bottom: 14px !important;
          }
          .cart-summary-item {
            font-size: 0.72rem !important;
          }
          .cart-total-label {
            font-size: 0.55rem !important;
          }
          .cart-total-num {
            font-size: 1.15rem !important;
          }
          .cart-total-items {
            font-size: 0.62rem !important;
          }
          .cart-checkout-btn {
            font-size: 0.7rem !important;
            padding: 12px !important;
          }
          .cart-empty-icon {
            width: 56px !important;
            height: 56px !important;
            font-size: 1.5rem !important;
          }
          .cart-empty-title {
            font-size: 1rem !important;
          }
          .cart-empty-text {
            font-size: 0.78rem !important;
          }
          .cart-continue-link {
            font-size: 0.62rem !important;
          }
        }
      `}</style>

      <div className="cart-page-wrap">
        <div className="cart-label-tag">Keranjang</div>
        <h1 className="cart-h1">
          KERANJANG BELANJA
          {totalItems > 0 && (
            <span className="cart-h1-count">({totalItems} item)</span>
          )}
        </h1>

        {totalItems === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', animation: 'fadeInUp 0.5s ease' }}>
            <div className="cart-empty-icon">🛒</div>
            <h3 className="cart-empty-title">KERANJANG KOSONG</h3>
            <p className="cart-empty-text">Belum ada produk di keranjang kamu</p>
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
          <div className="cart-main-grid">
            <div className="cart-items-col">
              {cart.items.map((item, i) => (
                <div key={item.cart_item_id}
                  className="cart-item-row"
                  style={{ animation: `fadeInUp 0.4s ease ${i * 0.06}s both` }}
                >
                  <Link to={`/product/${item.product_id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                    <div className="cart-item-img">
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

                  <div className="cart-item-info">
                    <div className="cart-brand">{item.product?.brand}</div>
                    <Link to={`/product/${item.product_id}`} className="cart-name">
                      {item.product?.product_name}
                    </Link>
                    <div className="cart-meta">
                      {item.size_ml}ml · {formatRupiah(item.price)}/botol
                    </div>
                  </div>

                  <div className="cart-item-controls">
                    <button className="cart-ctrl-btn"
                      onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}>
                      <Minus size={12} />
                    </button>
                    <div className="cart-ctrl-qty">{item.quantity}</div>
                    <button className="cart-ctrl-btn"
                      onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}>
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="cart-item-subtotal">
                    <div className="cart-subtotal-label">SUBTOTAL</div>
                    <div className="cart-subtotal-val">
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>

                  <button className="cart-item-delete" onClick={() => handleRemove(item.cart_item_id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <Link to="/catalog" className="cart-continue-link">
                <ArrowLeft size={13} /> LANJUT BELANJA
              </Link>
            </div>

            <div className="cart-summary">
              <div className="cart-section-title">RINGKASAN PESANAN</div>

              <div style={{ marginBottom: 20 }}>
                {cart.items.map(item => (
                  <div key={item.cart_item_id} className="cart-summary-item">
                    <span className="cart-summary-item-name">
                      {item.product?.product_name} ({item.size_ml}ml) ×{item.quantity}
                    </span>
                    <span className="cart-summary-item-price">
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

              <div className="cart-total-row">
                <div>
                  <div className="cart-total-label">TOTAL</div>
                  <div className="cart-total-num">{formatRupiah(total)}</div>
                </div>
                <div className="cart-total-items">{totalItems} produk</div>
              </div>

              <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                CHECKOUT <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}