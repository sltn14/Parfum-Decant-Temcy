import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Truck, Store } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const STATUS_CONFIG = {
  pending: { label: 'MENUNGGU BAYAR', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', step: 1 },
  paid: { label: 'DIBAYAR', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', step: 2 },
  processing: { label: 'DIPROSES', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', step: 3 },
  shipped: { label: 'DIKIRIM', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)', step: 4 },
  delivered: { label: 'SELESAI', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', step: 5 },
  cancelled: { label: 'DIBATALKAN', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', step: 0 }
}

const STEPS = ['MENUNGGU', 'DIBAYAR', 'DIPROSES', 'DIKIRIM', 'SELESAI']

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/my-orders/${id}`)
      setOrder(res.data.order)
    } catch {
      toast.error('Order tidak ditemukan')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (paying) return
    setPaying(true)
    try {
      const res = await api.post(`/orders/my-orders/${id}/create-payment`)
      const token = res.data.snap_token

      if (!token) {
        toast.error('Gagal mendapatkan token pembayaran')
        return
      }

      if (!window.snap) {
        const script = document.createElement('script')
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
        script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '')
        document.head.appendChild(script)
        await new Promise(resolve => { script.onload = resolve })
      }

      window.snap.pay(token, {
        onSuccess: () => { toast.success('Pembayaran berhasil!'); fetchOrder() },
        onPending: () => { toast('Menunggu pembayaran...', { icon: '⏳' }); fetchOrder() },
        onError: () => toast.error('Pembayaran gagal'),
        onClose: () => toast('Pembayaran belum selesai', { icon: '⚠️' })
      })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal memproses pembayaran')
    } finally {
      setPaying(false)
    }
  }

  const handleCancelOrder = async () => {
    setCancelling(true)
    try {
      await api.put(`/orders/my-orders/${id}/cancel`)
      toast.success('Pesanan berhasil dibatalkan')
      setShowCancelModal(false)
      fetchOrder()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal membatalkan pesanan')
    } finally {
      setCancelling(false)
    }
  }

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

  if (!order) return null

  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const currentStep = status.step

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .od-outer-pad { padding: 20px 16px !important; }
          .od-h1 { font-size: 1.1rem !important; }
          .od-status-badge { font-size: 0.55rem !important; padding: 4px 10px !important; }
          .od-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .od-main-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .od-summary { position: static !important; }
          .od-card { padding: 16px !important; }
          .od-section-title { font-size: 0.68rem !important; }
          .od-steps-wrap { padding: 12px 10px !important; overflow: visible !important; }
          .od-steps-inner { min-width: unset !important; width: 100% !important; }
          .od-step-circle { width: 24px !important; height: 24px !important; }
          .od-step-circle svg { width: 10px !important; height: 10px !important; }
          .od-step-label { font-size: 0.4rem !important; letter-spacing: 0.04em !important; }
          .od-step-line { margin: 0 4px 14px !important; }
          .od-item-row { gap: 10px !important; }
          .od-item-img { width: 52px !important; height: 52px !important; }
          .od-item-name { font-size: 0.8rem !important; }
          .od-item-meta { font-size: 0.65rem !important; }
          .od-total { font-size: 1.1rem !important; }
        }
      `}</style>
      <div className="od-outer-pad" style={{ maxWidth: 960, margin: '0 auto', padding: '48px 32px' }}>

        <button onClick={() => navigate('/orders')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: 'var(--text-muted)', marginBottom: 32,
          fontSize: '0.72rem', fontWeight: 800,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'color 0.2s ease',
          background: 'none', border: 'none'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} /> KEMBALI KE PESANAN
        </button>

        <div className="od-header-row" style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 28
        }}>
          <div>
            <div style={{
              fontSize: '0.62rem', fontWeight: 800,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--accent-red)', marginBottom: 8
            }}>Detail Pesanan</div>
            <h1 className="od-h1" style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
              {order.order_code}
            </h1>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500
            }}>
              <Clock size={12} />
              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </div>
          </div>
          <span className="od-status-badge" style={{
            padding: '6px 16px',
            background: status.bg, color: status.color,
            border: `1px solid ${status.border}`,
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.15em'
          }}>{status.label}</span>
        </div>

        {order.status !== 'cancelled' && (
          <div className="od-steps-wrap" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '22px 28px', marginBottom: 24
          }}>
            <div className="od-steps-inner" style={{ display: 'flex', alignItems: 'center' }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  flex: i < STEPS.length - 1 ? 1 : 'none'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                    <div className="od-step-circle" style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: i + 1 <= currentStep ? 'var(--accent-red)' : 'var(--bg-elevated)',
                      border: `1px solid ${i + 1 <= currentStep ? 'var(--accent-red)' : 'var(--border-default)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: '300ms ease', flexShrink: 0
                    }}>
                      {i + 1 <= currentStep
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        : <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)' }}>{i + 1}</span>
                      }
                    </div>
                    <span className="od-step-label" style={{
                      fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em',
                      color: i + 1 <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap'
                    }}>{step}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="od-step-line" style={{
                      flex: 1, height: 1, margin: '0 8px 18px',
                      background: i + 1 < currentStep ? 'var(--accent-red)' : 'var(--border-default)',
                      transition: '300ms ease'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div style={{
            padding: '16px 20px', marginBottom: 24,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: '0.68rem', fontWeight: 800,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#ef4444', marginBottom: 2
              }}>PESANAN DIBATALKAN</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Pesanan ini telah dibatalkan dan tidak dapat diproses lebih lanjut.
              </div>
            </div>
          </div>
        )}

        <div className="od-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {order.status === 'pending' && (
              <div style={{
                background: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 'var(--radius-lg)', padding: 24
              }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#f59e0b', marginBottom: 16
                }}>SELESAIKAN PEMBAYARAN</div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', marginBottom: 16,
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Total Pembayaran
                  </span>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--accent-red)', letterSpacing: '-0.02em' }}>
                    {formatRupiah(order.total_price)}
                  </span>
                </div>

                <button onClick={handlePayment} disabled={paying}
                  style={{
                    width: '100%', padding: '13px',
                    background: paying ? 'var(--border-hover)' : 'var(--accent-red)',
                    color: 'white', fontWeight: 800,
                    fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderRadius: 'var(--radius-sm)', border: 'none',
                    cursor: paying ? 'not-allowed' : 'pointer',
                    boxShadow: paying ? 'none' : '0 4px 14px rgba(240,46,41,0.3)',
                    transition: 'all 0.2s ease', marginBottom: 10
                  }}>
                  {paying ? 'MEMPROSES...' : 'BAYAR VIA QRIS'}
                </button>

                <button
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    width: '100%', padding: '11px',
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#ef4444', fontWeight: 800,
                    fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  BATALKAN PESANAN
                </button>
              </div>
            )}

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24
            }}>
              <div style={{
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 16
              }}>METODE PENGIRIMAN</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: order.delivery_method === 'pickup' ? 'rgba(34,197,94,0.1)' : 'rgba(240,46,41,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {order.delivery_method === 'pickup'
                    ? <Store size={16} style={{ color: '#22c55e' }} />
                    : <Truck size={16} style={{ color: 'var(--accent-red)' }} />
                  }
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>
                    {order.delivery_method === 'pickup' ? 'Pickup di Toko' : 'Dikirim ke Alamat'}
                  </div>
                  {order.delivery_method === 'delivery' && order.courier && (
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 700,
                      color: 'var(--accent-red)', letterSpacing: '0.06em', textTransform: 'uppercase'
                    }}>
                      {order.courier.toUpperCase()} {order.courier_service}
                      {order.shipping_cost > 0 && ` · ${formatRupiah(order.shipping_cost)}`}
                    </div>
                  )}
                  {order.delivery_method === 'pickup' && (
                    <div style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600 }}>Gratis Ongkir</div>
                  )}
                </div>
              </div>
            </div>

            {order.tracking_number && (
              <div style={{
                background: 'rgba(6,182,212,0.04)',
                border: '1px solid rgba(6,182,212,0.15)',
                borderRadius: 'var(--radius-lg)', padding: 24
              }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#06b6d4', marginBottom: 16
                }}>INFO PENGIRIMAN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {order.courier && (
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: 60, fontSize: '0.72rem' }}>Kurir</span>
                      <span style={{ fontWeight: 700 }}>{order.courier.toUpperCase()} {order.courier_service}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: 60, fontSize: '0.72rem' }}>No. Resi</span>
                    <span style={{ fontWeight: 900, color: '#06b6d4', letterSpacing: '0.06em', fontSize: '0.9rem' }}>
                      {order.tracking_number}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24
            }}>
              <div style={{
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 18
              }}>PRODUK DIPESAN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {order.items?.map((item, i) => (
                  <div key={i} className="od-item-row" style={{
                    display: 'flex', gap: 14, alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: i < order.items.length - 1 ? '1px solid var(--border-default)' : 'none'
                  }}>
                    <div className="od-item-img" style={{
                      width: 48, height: 48, flexShrink: 0,
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem'
                    }}>🧴</div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 800,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--accent-red)', marginBottom: 3
                      }}>{item.brand}</div>
                      <div className="od-item-name" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{item.product_name}</div>
                      <div className="od-item-meta" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {item.size_ml}ml × {item.quantity}
                      </div>
                    </div>
                    <div className="od-total" style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24
            }}>
              <div style={{
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 18
              }}>
                {order.delivery_method === 'pickup' ? 'INFORMASI PICKUP' : 'INFORMASI PENGIRIMAN'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Penerima', value: order.shipping_name },
                  { label: 'No. HP', value: order.shipping_phone },
                  order.delivery_method !== 'pickup' && { label: 'Kota', value: order.shipping_city },
                  { label: order.delivery_method === 'pickup' ? 'Lokasi Pickup' : 'Alamat', value: order.shipping_address },
                  order.shipping_notes && { label: 'Catatan', value: order.shipping_notes }
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: 72 }}>{label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Summary */}
          <div className="od-summary" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: 22,
            height: 'fit-content',
            position: 'sticky', top: 'calc(var(--navbar-height) + 24px)'
          }}>
            <div style={{
              fontSize: '0.62rem', fontWeight: 800,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--text-muted)', marginBottom: 18
            }}>RINGKASAN</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {[
                {
                  label: 'Subtotal',
                  value: formatRupiah((order.total_price || 0) + (order.discount_amount || 0) - (order.shipping_cost || 0))
                },
                {
                  label: 'Ongkir',
                  value: order.shipping_cost > 0 ? formatRupiah(order.shipping_cost) : 'GRATIS',
                  green: !order.shipping_cost || order.shipping_cost === 0
                },
                order.discount_amount > 0 && {
                  label: 'Diskon',
                  value: `-${formatRupiah(order.discount_amount)}`,
                  green: true
                },
                { label: 'Metode Bayar', value: 'QRIS' }
              ].filter(Boolean).map(({ label, value, green }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontWeight: 700, color: green ? '#22c55e' : 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--border-default)', marginBottom: 14 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)'
              }}>TOTAL</span>
              <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--accent-red)', letterSpacing: '-0.02em' }}>
                {formatRupiah(order.total_price)}
              </span>
            </div>

            {order.paid_at && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.68rem', fontWeight: 700,
                color: '#22c55e', letterSpacing: '0.04em', marginBottom: 10
              }}>
                DIBAYAR {new Date(order.paid_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </div>
            )}

            {order.voucher_code && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.68rem', fontWeight: 700,
                color: '#8b5cf6', letterSpacing: '0.04em'
              }}>
                VOUCHER: {order.voucher_code}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 36, maxWidth: 400, width: '100%',
            textAlign: 'center', animation: 'scaleIn 0.2s ease'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: '1.4rem', color: '#ef4444', fontWeight: 900
            }}>!</div>
            <h3 style={{
              fontWeight: 900, fontSize: '1rem',
              textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 10
            }}>BATALKAN PESANAN?</h3>
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.82rem',
              lineHeight: 1.8, marginBottom: 28, fontWeight: 400
            }}>
              Pesanan <strong style={{ color: 'var(--text-primary)' }}>{order?.order_code}</strong> akan
              dibatalkan. Tindakan ini tidak dapat diurungkan.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCancelModal(false)} style={{
                flex: 1, padding: '12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)', fontWeight: 800,
                fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer'
              }}>TIDAK</button>
              <button onClick={handleCancelOrder} disabled={cancelling} style={{
                flex: 1, padding: '12px',
                background: cancelling ? 'var(--border-hover)' : '#ef4444',
                color: 'white', borderRadius: 'var(--radius-sm)',
                fontWeight: 800, fontSize: '0.72rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                border: 'none', cursor: cancelling ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}>
                {cancelling ? 'MEMBATALKAN...' : 'YA, BATALKAN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}