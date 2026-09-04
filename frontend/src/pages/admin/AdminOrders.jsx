import { useState, useEffect } from 'react'
import { ChevronDown, Upload } from 'lucide-react'
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

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [trackingForm, setTrackingForm] = useState({})

  useEffect(() => { fetchOrders() }, [page, filterStatus])

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

  const handleUpdateTracking = async (orderId) => {
    const form = trackingForm[orderId] || {}
    if (!form.courier && !form.tracking_number) {
      toast.error('Isi kurir atau nomor resi')
      return
    }
    try {
      await api.post('/tracking', { order_id: orderId, ...form })
      toast.success('Tracking berhasil diupdate!')
      fetchOrders()
    } catch {
      toast.error('Gagal update tracking')
    }
  }

  const updateTrackingField = (orderId, field, value) => {
    setTrackingForm(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value }
    }))
  }

  const inputStyle = {
    padding: '9px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.82rem',
    outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500,
    transition: 'border-color 0.2s ease'
  }

  return (
    <div>
      <h1 style={{
        fontWeight: 900, fontSize: '1.8rem',
        letterSpacing: '-0.02em', textTransform: 'uppercase',
        color: 'var(--text-primary)', marginBottom: 32
      }}>MANAJEMEN PESANAN</h1>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => { setFilterStatus(''); setPage(1) }}
          style={{
            padding: '7px 14px',
            background: !filterStatus ? 'var(--accent-red)' : 'var(--bg-card)',
            border: `1px solid ${!filterStatus ? 'var(--accent-red)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-sm)',
            color: !filterStatus ? 'white' : 'var(--text-secondary)',
            fontWeight: 800, cursor: 'pointer',
            fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            transition: 'all 0.2s ease'
          }}>
          SEMUA ({total})
        </button>
        {STATUS_OPTIONS.map(s => {
          const config = STATUS_CONFIG[s]
          return (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }}
              style={{
                padding: '7px 14px',
                background: filterStatus === s ? config.bg : 'var(--bg-card)',
                border: `1px solid ${filterStatus === s ? config.color : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-sm)',
                color: filterStatus === s ? config.color : 'var(--text-secondary)',
                fontWeight: 800, cursor: 'pointer',
                fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}>
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Orders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>
            MEMUAT...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700 }}>
            TIDAK ADA PESANAN
          </div>
        ) : orders.map(order => {
          const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
          const isExpanded = expandedOrder === order.order_id

          return (
            <div key={order.order_id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
                onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 2, letterSpacing: '0.02em' }}>
                    {order.order_code}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                    {order.delivery_method === 'pickup' && (
                      <span style={{
                        marginLeft: 8, fontSize: '0.6rem', fontWeight: 800,
                        color: '#22c55e', letterSpacing: '0.1em'
                      }}>PICKUP</span>
                    )}
                  </div>
                </div>

                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  {formatRupiah(order.total_price)}
                </div>

                <span style={{
                  padding: '4px 12px',
                  background: status.bg, color: status.color,
                  border: `1px solid ${status.border}`,
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.6rem', fontWeight: 800,
                  letterSpacing: '0.1em'
                }}>{status.label}</span>

                <ChevronDown size={15}
                  style={{
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: '200ms ease', flexShrink: 0
                  }} />
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid var(--border-default)',
                  padding: '20px 20px 24px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                    {/* Left: Items + Shipping */}
                    <div>
                      {/* Items */}
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 800,
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'var(--text-muted)', marginBottom: 10
                      }}>PRODUK</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', fontSize: '0.82rem',
                            padding: '8px 0',
                            borderBottom: i < order.items.length - 1 ? '1px solid var(--border-default)' : 'none'
                          }}>
                            <div>
                              <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>
                                ({item.size_ml}ml × {item.quantity})
                              </span>
                            </div>
                            <span style={{ fontWeight: 700 }}>
                              {formatRupiah(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Shipping */}
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 800,
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'var(--text-muted)', marginBottom: 10
                      }}>PENGIRIMAN</div>
                      <div style={{
                        padding: '12px 14px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-default)',
                        fontSize: '0.82rem', color: 'var(--text-secondary)',
                        lineHeight: 1.8, fontWeight: 400
                      }}>
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                          {order.shipping_name}
                        </strong> · {order.shipping_phone}
                        <br />
                        {order.shipping_address}, {order.shipping_city}
                        {order.courier && (
                          <div style={{ marginTop: 6 }}>
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 800,
                              color: 'var(--accent-red)', letterSpacing: '0.1em'
                            }}>
                              {order.courier?.toUpperCase()} {order.courier_service}
                            </span>
                            {order.tracking_number && (
                              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontWeight: 500 }}>
                                Resi: {order.tracking_number}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Payment proof */}
                      {order.payment_proof && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{
                            fontSize: '0.6rem', fontWeight: 800,
                            letterSpacing: '0.15em', textTransform: 'uppercase',
                            color: 'var(--text-muted)', marginBottom: 8
                          }}>BUKTI BAYAR</div>
                          <a
                            href={`http://localhost:5000/uploads/payments/${order.payment_proof}`}
                            target="_blank" rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '7px 14px',
                              background: 'rgba(59,130,246,0.08)',
                              border: '1px solid rgba(59,130,246,0.2)',
                              borderRadius: 'var(--radius-sm)',
                              color: '#3b82f6', fontWeight: 700,
                              fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                              textDecoration: 'none'
                            }}> 
                            <Upload size={12} /> LIHAT BUKTI BAYAR
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Right: Status + Tracking */}
                    <div>
                      {/* Update Status */}
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 800,
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'var(--text-muted)', marginBottom: 10
                      }}>UPDATE STATUS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                        {STATUS_OPTIONS.map(s => {
                          const config = STATUS_CONFIG[s]
                          const isCurrent = order.status === s
                          return (
                            <button key={s}
                              onClick={() => !isCurrent && handleUpdateStatus(order.order_id, s)}
                              style={{
                                padding: '6px 12px',
                                background: isCurrent ? config.bg : 'var(--bg-elevated)',
                                border: `1px solid ${isCurrent ? config.color : 'var(--border-default)'}`,
                                borderRadius: 'var(--radius-xs)',
                                color: isCurrent ? config.color : 'var(--text-muted)',
                                fontWeight: isCurrent ? 800 : 600,
                                cursor: isCurrent ? 'not-allowed' : 'pointer',
                                fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => {
                                if (!isCurrent) {
                                  e.currentTarget.style.borderColor = config.color
                                  e.currentTarget.style.color = config.color
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isCurrent) {
                                  e.currentTarget.style.borderColor = 'var(--border-default)'
                                  e.currentTarget.style.color = 'var(--text-muted)'
                                }
                              }}>
                              {config.label}
                            </button>
                          )
                        })}
                      </div>

                      {/* Update Tracking */}
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 800,
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'var(--text-muted)', marginBottom: 10
                      }}>UPDATE TRACKING</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input
                            placeholder="Kurir (JNE, J&T...)"
                            value={trackingForm[order.order_id]?.courier || ''}
                            onChange={e => updateTrackingField(order.order_id, 'courier', e.target.value)}
                            style={{ ...inputStyle, width: '100%' }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                          />
                          <input
                            placeholder="Nomor Resi"
                            value={trackingForm[order.order_id]?.tracking_number || ''}
                            onChange={e => updateTrackingField(order.order_id, 'tracking_number', e.target.value)}
                            style={{ ...inputStyle, width: '100%' }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                          />
                        </div>
                        <input
                          placeholder="Status pengiriman (opsional)"
                          value={trackingForm[order.order_id]?.description || ''}
                          onChange={e => updateTrackingField(order.order_id, 'description', e.target.value)}
                          style={{ ...inputStyle, width: '100%' }}
                          onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                        />
                        <button onClick={() => handleUpdateTracking(order.order_id)}
                          style={{
                            padding: '9px 18px',
                            background: 'var(--accent-red)', color: 'white',
                            borderRadius: 'var(--radius-sm)', fontWeight: 800,
                            fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                            border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 4px 12px rgba(240,46,41,0.3)',
                            transition: 'all 0.2s ease', width: 'fit-content'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <Upload size={12} /> SIMPAN TRACKING
                        </button>
                      </div>

                      {/* Summary */}
                      <div style={{
                        marginTop: 24, padding: '14px 16px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-default)'
                      }}>
                        {[
                          { label: 'Subtotal', value: formatRupiah(order.total_price - (order.shipping_cost || 0) + (order.discount_amount || 0)) },
                          { label: 'Ongkir', value: order.shipping_cost ? formatRupiah(order.shipping_cost) : 'GRATIS', green: !order.shipping_cost },
                          order.discount_amount > 0 && { label: 'Diskon', value: `-${formatRupiah(order.discount_amount)}`, green: true },
                          { label: 'TOTAL', value: formatRupiah(order.total_price), bold: true }
                        ].filter(Boolean).map(({ label, value, green, bold }) => (
                          <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: bold ? '0.88rem' : '0.78rem',
                            marginBottom: bold ? 0 : 6,
                            paddingTop: bold ? 8 : 0,
                            borderTop: bold ? '1px solid var(--border-default)' : 'none',
                            marginTop: bold ? 6 : 0
                          }}>
                            <span style={{
                              color: 'var(--text-muted)', fontWeight: bold ? 800 : 500,
                              letterSpacing: bold ? '0.08em' : 0, textTransform: bold ? 'uppercase' : 'none'
                            }}>{label}</span>
                            <span style={{
                              fontWeight: bold ? 900 : 600,
                              color: green ? '#22c55e' : bold ? 'var(--accent-red)' : 'var(--text-primary)'
                            }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {Math.ceil(total / 10) > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: '8px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.78rem'
            }}>← PREV</button>
          <span style={{
            padding: '8px 16px', color: 'var(--text-muted)',
            fontSize: '0.78rem', fontWeight: 700
          }}>
            {page} / {Math.ceil(total / 10)}
          </span>
          <button onClick={() => setPage(p => Math.min(Math.ceil(total / 10), p + 1))}
            disabled={page === Math.ceil(total / 10)}
            style={{
              padding: '8px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: page === Math.ceil(total / 10) ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === Math.ceil(total / 10) ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.78rem'
            }}>NEXT →</button>
        </div>
      )}
    </div>
  )
}