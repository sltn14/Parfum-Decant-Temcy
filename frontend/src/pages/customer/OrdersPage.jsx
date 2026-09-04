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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 10
          }}>Riwayat</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase'
            }}>PESANAN SAYA</h1>
            <div style={{
              fontSize: '0.72rem', color: 'var(--text-muted)',
              fontWeight: 700, letterSpacing: '0.04em'
            }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>{filtered.length}</span>
              {filterStatus ? ' pesanan' : ` dari ${orders.length} pesanan`}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div style={{
            display: 'flex', gap: 6, marginBottom: 28,
            overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none'
          }}>
            {FILTER_TABS.map(({ key, label }) => {
              const count = key ? orders.filter(o => o.status === key).length : orders.length
              if (key && count === 0) return null
              const isActive = filterStatus === key
              const config = key ? STATUS_CONFIG[key] : null
              return (
                <button key={key}
                  onClick={() => setFilterStatus(key)}
                  style={{
                    padding: '7px 14px', flexShrink: 0,
                    background: isActive
                      ? (config ? config.bg : 'rgba(240,46,41,0.1)')
                      : 'var(--bg-card)',
                    border: `1px solid ${isActive
                      ? (config ? config.border : 'rgba(240,46,41,0.3)')
                      : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-xs)',
                    color: isActive
                      ? (config ? config.color : 'var(--accent-red)')
                      : 'var(--text-muted)',
                    fontWeight: 800, cursor: 'pointer',
                    fontSize: '0.6rem', letterSpacing: '0.1em',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: 6
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
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Package size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{
              fontSize: '1.1rem', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 8
            }}>
              {filterStatus ? 'TIDAK ADA PESANAN' : 'BELUM ADA PESANAN'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 28, fontWeight: 400 }}>
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
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 22px', cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    animation: `fadeInUp 0.4s ease ${i * 0.05}s both`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(240,46,41,0.25)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-default)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  {/* Top row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 14
                  }}>
                    <div>
                      <div style={{
                        fontWeight: 900, fontSize: '0.88rem',
                        letterSpacing: '0.04em', marginBottom: 5
                      }}>{order.order_code}</div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500
                      }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        padding: '4px 12px',
                        background: status.bg,
                        border: `1px solid ${status.border}`,
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.58rem', fontWeight: 800,
                        letterSpacing: '0.12em', color: status.color
                      }}>{status.label}</span>
                      <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                  </div>

                  {/* Products preview */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {order.items?.slice(0, 3).map((item, j) => (
                      <div key={j} style={{
                        padding: '4px 10px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.72rem', color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        {item.product_name} ({item.size_ml}ml)
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div style={{
                        padding: '4px 10px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600
                      }}>
                        +{order.items.length - 3} lainnya
                      </div>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 14, borderTop: '1px solid var(--border-default)'
                  }}>
                    <span style={{
                      fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600
                    }}>
                      {order.items?.length} produk
                    </span>
                    <span style={{
                      fontWeight: 900, color: 'var(--accent-red)',
                      fontSize: '0.95rem', letterSpacing: '-0.01em'
                    }}>
                      {formatRupiah(order.total_price)}
                    </span>
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