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

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders')
      setOrders(res.data.orders)
    } catch { toast.error('Gagal memuat pesanan') }
    finally { setLoading(false) }
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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 10
          }}>Riwayat</div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase'
          }}>PESANAN SAYA</h1>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', animation: 'fadeInUp 0.5s ease' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Package size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{
              fontSize: '1.2rem', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 10
            }}>BELUM ADA PESANAN</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 32, fontWeight: 400 }}>
              Yuk mulai belanja parfum favorit kamu
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
              MULAI BELANJA
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order, i) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              return (
                <div key={order.order_id}
                  onClick={() => navigate(`/orders/${order.order_id}`)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px', cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    animation: `fadeInUp 0.4s ease ${i * 0.06}s both`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(240,46,41,0.3)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-default)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 16
                  }}>
                    <div>
                      <div style={{
                        fontWeight: 900, fontSize: '0.88rem',
                        letterSpacing: '0.04em', marginBottom: 6
                      }}>{order.order_code}</div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500
                      }}>
                        <Clock size={11} />
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        padding: '5px 12px',
                        background: status.bg,
                        border: `1px solid ${status.border}`,
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.6rem', fontWeight: 800,
                        letterSpacing: '0.12em', color: status.color
                      }}>{status.label}</span>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {order.items?.slice(0, 3).map((item, j) => (
                      <div key={j} style={{
                        padding: '5px 12px',
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
                        padding: '5px 12px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600
                      }}>
                        +{order.items.length - 3} lainnya
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    paddingTop: 16, borderTop: '1px solid var(--border-default)'
                  }}>
                    <span style={{
                      fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600
                    }}>{order.items?.length} produk</span>
                    <span style={{
                      fontWeight: 900, color: 'var(--accent-red)',
                      fontSize: '0.95rem', letterSpacing: '-0.01em'
                    }}>{formatRupiah(order.total_price)}</span>
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