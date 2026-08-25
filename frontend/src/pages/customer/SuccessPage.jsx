import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Home, ShoppingBag } from 'lucide-react'
import api from '../../api/axios'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export default function SuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState(null)
  const [countdown, setCountdown] = useState(10)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    if (orderId) fetchOrder()

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); navigate('/orders'); return 0 }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/my-orders/${orderId}`)
      setOrder(res.data.order)
    } catch {}
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 32,
      position: 'relative', overflow: 'hidden'
    }}>
      {/* BG */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.06) 0%, transparent 60%)'
      }} />

      <div style={{
        width: '100%', maxWidth: 520, textAlign: 'center',
        position: 'relative', zIndex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1)'
      }}>

        {/* Success Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px', fontSize: '2.2rem',
          animation: 'scaleIn 0.5s ease 0.3s both'
        }}>✓</div>

        <div style={{
          fontSize: '0.65rem', fontWeight: 800,
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: '#22c55e', marginBottom: 12
        }}>Pesanan Berhasil</div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 900, letterSpacing: '-0.03em',
          textTransform: 'uppercase', marginBottom: 16
        }}>TERIMA KASIH!</h1>

        <p style={{
          color: 'var(--text-muted)', fontSize: '0.88rem',
          lineHeight: 1.8, marginBottom: 36, fontWeight: 400
        }}>
          Pesanan kamu sudah berhasil dibuat. Segera selesaikan pembayaran untuk memproses pesanan.
        </p>

        {/* Order Info */}
        {order && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: 24,
            marginBottom: 32, textAlign: 'left',
            animation: 'fadeInUp 0.5s ease 0.4s both'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 4
                }}>KODE PESANAN</div>
                <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                  {order.order_code}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 4
                }}>TOTAL</div>
                <div style={{
                  fontWeight: 900, color: 'var(--accent-red)',
                  fontSize: '0.95rem'
                }}>
                  {formatRupiah(order.total_price)}
                </div>
              </div>
            </div>

            <div style={{
              height: 1, background: 'var(--border-default)', marginBottom: 16
            }} />

            {order.items?.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.78rem', padding: '4px 0',
                color: 'var(--text-secondary)', fontWeight: 500
              }}>
                <span>{item.product_name} ({item.size_ml}ml) ×{item.quantity}</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}

            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem', fontWeight: 700,
              color: '#f59e0b', letterSpacing: '0.04em'
            }}>
              ⏳ SELESAIKAN PEMBAYARAN DI HALAMAN DETAIL PESANAN
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button onClick={() => navigate('/')}
            style={{
              flex: 1, padding: '13px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', fontWeight: 800,
              fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease'
            }}>
            <Home size={14} /> BERANDA
          </button>
          <button onClick={() => navigate('/orders')}
            style={{
              flex: 2, padding: '13px',
              background: 'var(--accent-red)', color: 'white',
              borderRadius: 'var(--radius-sm)', fontWeight: 800,
              fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(240,46,41,0.35)'
            }}>
            <ShoppingBag size={14} /> LIHAT PESANAN <ArrowRight size={14} />
          </button>
        </div>

        <p style={{
          fontSize: '0.72rem', color: 'var(--text-muted)',
          fontWeight: 600, letterSpacing: '0.04em'
        }}>
          Otomatis ke pesanan dalam{' '}
          <span style={{ color: 'var(--accent-red)', fontWeight: 900 }}>{countdown}</span> detik
        </p>
      </div>
    </div>
  )
}