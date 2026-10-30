import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, Package } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const STATUS_CONFIG = {
  pending: { label: 'MENUNGGU BAYAR', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  paid: { label: 'DIBAYAR', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  processing: { label: 'DIPROSES', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  shipped: { label: 'DIKIRIM', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
  delivered: { label: 'SELESAI', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
  cancelled: { label: 'DIBATALKAN', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' }
}

const FILTER_TABS = [
  { key: '', label: 'SEMUA' },
  { key: 'pending', label: 'MENUNGGU BAYAR' },
  { key: 'paid', label: 'DIBAYAR' },
  { key: 'processing', label: 'DIPROSES' },
  { key: 'shipped', label: 'DIKIRIM' },
  { key: 'delivered', label: 'SELESAI' },
  { key: 'cancelled', label: 'DIBATALKAN' },
]

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders')
      setOrders(res.data.orders)
    } catch { toast.error('Gagal memuat pesanan') }
    finally { setLoading(false) }
  }

  const filtered = filterStatus
    ? orders.filter(o => o.status === filterStatus)
    : orders

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
          margin: '0 auto 14px'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em' }}>
          MEMUAT...
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <style>{`
        .orders-page-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 48px 32px;
        }
        .orders-label-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent-red);
          margin-bottom: 10px;
        }
        .orders-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
        }
        .orders-h1 {
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin: 0;
        }
        .orders-count {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .orders-filter-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 28px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .orders-filter-tabs::-webkit-scrollbar {
          display: none;
        }
        .orders-filter-btn {
          padding: 7px 14px;
          flex-shrink: 0;
          border-radius: var(--radius-xs);
          font-weight: 800;
          cursor: pointer;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .orders-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 18px 22px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .orders-card:hover {
          border-color: rgba(240,46,41,0.25);
          transform: translateX(4px);
        }
        .orders-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        .orders-card-code {
          font-weight: 900;
          font-size: 0.88rem;
          letter-spacing: 0.04em;
          margin-bottom: 5px;
        }
        .orders-card-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .orders-card-top-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .orders-card-status {
          padding: 4px 12px;
          border-radius: var(--radius-xs);
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .orders-chips-row {
          display: flex;
          gap: 6px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .orders-product-chip {
          padding: 4px 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xs);
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .orders-bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          border-top: 1px solid var(--border-default);
        }
        .orders-product-count {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .orders-total {
          font-weight: 900;
          color: var(--accent-red);
          font-size: 0.95rem;
          letter-spacing: -0.01em;
        }
        .orders-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .orders-empty-title {
          font-size: 1.1rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .orders-empty-text {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 28px;
          font-weight: 400;
        }

        /* === MOBILE === */
        @media (max-width: 768px) {
          .orders-page-wrap {
            padding: 20px 14px !important;
          }
          .orders-label-tag {
            font-size: 0.55rem !important;
            letter-spacing: 0.15em !important;
          }
          .orders-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            margin-bottom: 16px !important;
          }
          .orders-h1 {
            font-size: 1.25rem !important;
          }
          .orders-count {
            font-size: 0.65rem !important;
          }
          .orders-filter-tabs {
            margin-bottom: 16px !important;
          }
          .orders-filter-btn {
            font-size: 0.55rem !important;
            padding: 5px 10px !important;
          }
          .orders-card {
            padding: 12px 12px !important;
            border-radius: var(--radius-sm) !important;
          }
          .orders-card:hover {
            transform: none !important;
          }
          .orders-card-top {
            margin-bottom: 10px !important;
          }
          .orders-card-code {
            font-size: 0.75rem !important;
            margin-bottom: 3px !important;
          }
          .orders-card-date {
            font-size: 0.6rem !important;
          }
          .orders-card-top-right {
            gap: 6px !important;
          }
          .orders-card-status {
            font-size: 0.5rem !important;
            padding: 3px 7px !important;
          }
          .orders-chips-row {
            gap: 5px !important;
            margin-bottom: 10px !important;
          }
          .orders-product-chip {
            font-size: 0.58rem !important;
            padding: 3px 7px !important;
          }
          .orders-bottom-row {
            padding-top: 10px !important;
          }
          .orders-product-count {
            font-size: 0.62rem !important;
          }
          .orders-total {
            font-size: 0.82rem !important;
          }
          .orders-empty-icon {
            width: 52px !important;
            height: 52px !important;
          }
          .orders-empty-title {
            font-size: 0.95rem !important;
          }
          .orders-empty-text {
            font-size: 0.75rem !important;
          }
        }
      `}</style>

      <div className="orders-page-wrap">

        {/* Header */}
        <div className="orders-label-tag">Riwayat</div>
        <div className="orders-header-row">
          <h1 className="orders-h1">PESANAN SAYA</h1>
          <div className="orders-count">
            <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{filtered.length}</span>
            {filterStatus ? ' pesanan' : ` dari ${orders.length} pesanan`}
          </div>
        </div>

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div className="orders-filter-tabs">
            {FILTER_TABS.map(({ key, label }) => {
              const count = key ? orders.filter(o => o.status === key).length : orders.length
              if (key && count === 0) return null
              const isActive = filterStatus === key
              const config = key ? STATUS_CONFIG[key] : null
              return (
                <button key={key}
                  onClick={() => setFilterStatus(key)}
                  className="orders-filter-btn"
                  style={{
                    background: isActive
                      ? (config ? config.bg : 'rgba(240,46,41,0.1)')
                      : 'var(--bg-card)',
                    border: `1px solid ${isActive
                      ? (config ? config.border : 'rgba(240,46,41,0.3)')
                      : 'var(--border-default)'}`,
                    color: isActive
                      ? (config ? config.color : 'var(--accent-red)')
                      : 'var(--text-muted)',
                  }}>
                  {label}
                  <span style={{
                    padding: '1px 6px',
                    background: isActive ? 'rgba(0,0,0,0.15)' : 'var(--bg-elevated)',
                    borderRadius: 10, fontSize: '0.58rem', fontWeight: 900
                  }}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Orders */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', animation: 'fadeInUp 0.5s ease' }}>
            <div className="orders-empty-icon">
              <Package size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="orders-empty-title">
              {filterStatus ? 'TIDAK ADA PESANAN' : 'BELUM ADA PESANAN'}
            </h3>
            <p className="orders-empty-text">
              {filterStatus
                ? `Tidak ada pesanan dengan status "${STATUS_CONFIG[filterStatus]?.label}"`
                : 'Yuk mulai belanja parfum favorit kamu'}
            </p>
            {!filterStatus && (
              <button onClick={() => navigate('/catalog')}
                style={{
                  padding: '13px 28px',
                  background: 'var(--accent-red)', color: 'white',
                  borderRadius: 'var(--radius-sm)', fontWeight: 800,
                  fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(240,46,41,0.3)'
                }}>
                MULAI BELANJA
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((order, i) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              return (
                <div key={order.order_id}
                  onClick={() => navigate(`/orders/${order.order_id}`)}
                  className="orders-card"
                  style={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}
                >
                  {/* Top row */}
                  <div className="orders-card-top">
                    <div>
                      <div className="orders-card-code">{order.order_code}</div>
                      <div className="orders-card-date">
                        <Clock size={11} />
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                        {order.delivery_method === 'pickup' && (
                          <span style={{
                            marginLeft: 6, fontSize: '0.6rem', fontWeight: 800,
                            color: '#22c55e', letterSpacing: '0.1em',
                            padding: '1px 6px',
                            background: 'rgba(34,197,94,0.1)',
                            borderRadius: 'var(--radius-xs)'
                          }}>PICKUP</span>
                        )}
                      </div>
                    </div>
                    <div className="orders-card-top-right">
                      <span className="orders-card-status" style={{
                        background: status.bg,
                        border: `1px solid ${status.border}`,
                        color: status.color
                      }}>{status.label}</span>
                      <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                  </div>

                  {/* Products preview */}
                  <div className="orders-chips-row">
                    {order.items?.slice(0, 3).map((item, j) => (
                      <div key={j} className="orders-product-chip">
                        {item.product_name} ({item.size_ml}ml)
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="orders-product-chip" style={{ color: 'var(--text-muted)' }}>
                        +{order.items.length - 3} lainnya
                      </div>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div className="orders-bottom-row">
                    <span className="orders-product-count">{order.items?.length} produk</span>
                    <span className="orders-total">{formatRupiah(order.total_price)}</span>
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