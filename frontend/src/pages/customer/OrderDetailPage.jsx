import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num)

const STATUS_CONFIG = {
  pending: {
    label: 'Menunggu Pembayaran',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    step: 1
  },
  paid: {
    label: 'Pembayaran Diterima',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    step: 2
  },
  processing: {
    label: 'Diproses',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    step: 3
  },
  shipped: {
    label: 'Dikirim',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    step: 4
  },
  delivered: {
    label: 'Selesai',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    step: 5
  },
  cancelled: {
    label: 'Dibatalkan',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    step: 0
  }
}

const STEPS = [
  'Menunggu Bayar',
  'Dibayar',
  'Diproses',
  'Dikirim',
  'Selesai'
]

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

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

  // =========================
  // MIDTRANS PAYMENT
  // =========================
  const handlePayment = async () => {
    if (paying) return

    setPaying(true)

    try {
      const res = await api.post(`/orders/my-orders/${id}/create-payment`)
      const { token } = res.data

      if (!window.snap) {
        toast.error('Midtrans Snap belum siap. Silakan refresh halaman.')
        return
      }

      // Buka Midtrans Snap popup
      window.snap.pay(token, {
        onSuccess: async () => {
          toast.success('Pembayaran berhasil!')
          await fetchOrder()
        },

        onPending: async () => {
          toast('Pembayaran pending, cek email kamu')
          await fetchOrder()
        },

        onError: () => {
          toast.error('Pembayaran gagal')
        },

        onClose: () => {
          toast('Pembayaran dibatalkan')
        }
      })
    } catch (err) {
      console.error('Payment error:', err)
      toast.error(
        err?.response?.data?.message ||
        'Gagal memproses pembayaran'
      )
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          paddingTop: 'var(--navbar-height)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ color: 'var(--text-muted)' }}>
          Memuat...
        </div>
      </div>
    )
  }

  if (!order) return null

  const status =
    STATUS_CONFIG[order.status] || STATUS_CONFIG.pending

  const currentStep = status.step

  return (
    <div
      style={{
        paddingTop: 'var(--navbar-height)',
        minHeight: '100vh'
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 24px'
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/orders')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            marginBottom: 32,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
          Kembali ke Pesanan
        </button>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 32
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                fontWeight: 700,
                marginBottom: 6
              }}
            >
              {order.order_code}
            </h1>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}
            >
              {new Date(order.createdAt).toLocaleDateString(
                'id-ID',
                {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }
              )}
            </p>
          </div>

          <span
            style={{
              padding: '6px 16px',
              background: status.bg,
              color: status.color,
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Progress Steps */}
        {order.status !== 'cancelled' && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              marginBottom: 24
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: i < STEPS.length - 1 ? 1 : 'none'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background:
                          i + 1 <= currentStep
                            ? 'var(--accent-red)'
                            : 'var(--bg-elevated)',
                        border: `2px solid ${
                          i + 1 <= currentStep
                            ? 'var(--accent-red)'
                            : 'var(--border-default)'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color:
                          i + 1 <= currentStep
                            ? 'white'
                            : 'var(--text-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {i + 1 <= currentStep ? (
                        <CheckCircle size={16} />
                      ) : (
                        i + 1
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        color:
                          i + 1 <= currentStep
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                        fontWeight:
                          i + 1 <= currentStep ? 600 : 400,
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {step}
                    </span>
                  </div>

                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background:
                          i + 1 < currentStep
                            ? 'var(--accent-red)'
                            : 'var(--border-default)',
                        margin: '0 8px 22px'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: 24
          }}
        >
          {/* Left */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24
            }}
          >
            {/* =========================
                MIDTRANS PAYMENT
            ========================= */}
            {order.status === 'pending' && (
              <div
                style={{
                  background: 'rgba(245,158,11,0.05)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24
                }}
              >
                <h3
                  style={{
                    fontWeight: 700,
                    marginBottom: 8,
                    color: '#f59e0b'
                  }}
                >
                  ⚠️ Selesaikan Pembayaran
                </h3>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginBottom: 20
                  }}
                >
                  Klik tombol di bawah untuk membayar via
                  QRIS. QR code akan muncul di popup.
                </p>

                {/* Total Pembayaran */}
                <div
                  style={{
                    padding: '16px 20px',
                    marginBottom: 20,
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Total Pembayaran
                  </span>

                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      color: 'var(--accent-red)'
                    }}
                  >
                    {formatRupiah(order.total_price)}
                  </span>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: paying
                      ? '#d97706'
                      : '#f59e0b',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    border: 'none',
                    cursor: paying
                      ? 'not-allowed'
                      : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    opacity: paying ? 0.8 : 1
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>
                    📱
                  </span>

                  {paying
                    ? 'Memproses Pembayaran...'
                    : 'Bayar Sekarang via QRIS'}
                </button>

                <p
                  style={{
                    textAlign: 'center',
                    marginTop: 12,
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  Powered by Midtrans · Aman & Terpercaya
                </p>
              </div>
            )}

            {/* Order Items */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 24
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  marginBottom: 16
                }}
              >
                Produk Dipesan
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom:
                        i < order.items.length - 1
                          ? '1px solid var(--border-default)'
                          : 'none'
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        flexShrink: 0
                      }}
                    >
                      🧴
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--accent-red)',
                          fontWeight: 600
                        }}
                      >
                        {item.brand}
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}
                      >
                        {item.product_name}
                      </div>

                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {item.size_ml}ml × {item.quantity}
                      </div>
                    </div>

                    <div style={{ fontWeight: 700 }}>
                      {formatRupiah(
                        item.price * item.quantity
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: 24
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  marginBottom: 16
                }}
              >
                Informasi Pengiriman
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                {[
                  {
                    label: 'Penerima',
                    value: order.shipping_name
                  },
                  {
                    label: 'No. HP',
                    value: order.shipping_phone
                  },
                  {
                    label: 'Kota',
                    value: order.shipping_city
                  },
                  {
                    label: 'Alamat',
                    value: order.shipping_address
                  },
                  order.shipping_notes && {
                    label: 'Catatan',
                    value: order.shipping_notes
                  }
                ]
                  .filter(Boolean)
                  .map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        gap: 16
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          minWidth: 80
                        }}
                      >
                        {label}
                      </span>

                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right - Summary */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              height: 'fit-content',
              position: 'sticky',
              top: 'calc(var(--navbar-height) + 24px)'
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                marginBottom: 16
              }}
            >
              Ringkasan Pembayaran
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 16
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.9rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Subtotal
                </span>
                <span>
                  {formatRupiah(order.total_price)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.9rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Ongkos Kirim
                </span>

                <span style={{ color: '#22c55e' }}>
                  Gratis
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.9rem'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Metode Bayar
                </span>

                <span>QRIS</span>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-default)',
                paddingTop: 16
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700
                }}
              >
                <span>Total</span>

                <span
                  style={{
                    color: 'var(--accent-red)',
                    fontSize: '1.1rem'
                  }}
                >
                  {formatRupiah(order.total_price)}
                </span>
              </div>
            </div>

            {order.paid_at && (
              <div
                style={{
                  marginTop: 16,
                  padding: '10px 14px',
                  background: 'rgba(34,197,94,0.1)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  color: '#22c55e'
                }}
              >
                ✓ Dibayar pada{' '}
                {new Date(order.paid_at).toLocaleDateString(
                  'id-ID'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}