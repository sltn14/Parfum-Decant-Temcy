import { useState, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const STATUS_CONFIG = {
  pending: { label: 'Menunggu Bayar', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  paid: { label: 'Dibayar', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  processing: { label: 'Diproses', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  shipped: { label: 'Dikirim', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  delivered: { label: 'Selesai', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  cancelled: { label: 'Dibatalkan', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
}

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [page, filterStatus])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (filterStatus) params.set('status', filterStatus)
      const res = await api.get(`/orders?${params}`)
      setOrders(res.data.orders)
      setTotal(res.data.total)
    } catch {
      toast.error('Gagal memuat pesanan')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      toast.success('Status berhasil diupdate!')
      fetchOrders()
    } catch {
      toast.error('Gagal update status')
    }
  }

  return (
    <div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.8rem', fontWeight: 700, marginBottom: 32,
        color: 'var(--text-primary)'
      }}>Manajemen Pesanan</h1>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => { setFilterStatus(''); setPage(1) }}
          style={{
            padding: '8px 16px',
            background: !filterStatus ? 'var(--accent-red)' : 'var(--bg-card)',
            border: `1px solid ${!filterStatus ? 'var(--accent-red)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            color: !filterStatus ? 'white' : 'var(--text-secondary)',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
          }}>
          Semua ({total})
        </button>
        {STATUS_OPTIONS.map(s => {
          const config = STATUS_CONFIG[s]
          return (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }}
              style={{
                padding: '8px 16px',
                background: filterStatus === s ? config.bg : 'var(--bg-card)',
                border: `1px solid ${filterStatus === s ? config.color : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                color: filterStatus === s ? config.color : 'var(--text-secondary)',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
              }}>
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Memuat...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Tidak ada pesanan
          </div>
        ) : (
          orders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const isExpanded = expandedOrder === order.order_id

            return (
              <div key={order.order_id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center',
                  gap: 16, cursor: 'pointer'
                }}
                  onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>
                      {order.order_code}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {formatRupiah(order.total_price)}
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    background: status.bg, color: status.color,
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem', fontWeight: 600
                  }}>{status.label}</span>
                  <ChevronDown size={16}
                    style={{
                      color: 'var(--text-muted)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: '200ms ease'
                    }} />
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid var(--border-default)',
                    padding: '20px'
                  }}>
                    {/* Items */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                        PRODUK
                      </div>
                      {order.items?.map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: '0.85rem', padding: '6px 0',
                          borderBottom: i < order.items.length - 1 ? '1px solid var(--border-default)' : 'none'
                        }}>
                          <span>{item.product_name} ({item.size_ml}ml) × {item.quantity}</span>
                          <span style={{ fontWeight: 600 }}>{formatRupiah(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                        PENGIRIMAN
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        {order.shipping_name} · {order.shipping_phone}<br />
                        {order.shipping_address}, {order.shipping_city}
                      </div>
                    </div>

                    {/* Update Status */}
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                        UPDATE STATUS
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {STATUS_OPTIONS.map(s => {
                          const config = STATUS_CONFIG[s]
                          return (
                            <button key={s}
                              onClick={() => handleUpdateStatus(order.order_id, s)}
                              disabled={order.status === s}
                              style={{
                                padding: '6px 14px',
                                background: order.status === s ? config.bg : 'var(--bg-elevated)',
                                border: `1px solid ${order.status === s ? config.color : 'var(--border-default)'}`,
                                borderRadius: 'var(--radius-md)',
                                color: order.status === s ? config.color : 'var(--text-secondary)',
                                fontWeight: order.status === s ? 700 : 400,
                                cursor: order.status === s ? 'not-allowed' : 'pointer',
                                fontSize: '0.8rem'
                              }}>
                              {config.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}