import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Home, ShoppingBag, Loader2 } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export default function SuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState(null)
  const [visible, setVisible] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [snapToken, setSnapToken] = useState(null)
  const paymentTriggered = useRef(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    if (orderId) fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/my-orders/${orderId}`)
      const orderData = res.data.order
      setOrder(orderData)

      if (orderData.status === 'pending' && !paymentTriggered.current) {
        paymentTriggered.current = true
        triggerPayment(orderData.order_id)
      }
    } catch {}
  }

  const triggerPayment = async (id) => {
    setPaymentLoading(true)
    try {
      const res = await api.post(`/orders/my-orders/${id}/create-payment`)
      const token = res.data.snap_token

      if (!token) {
        toast.error('Gagal mendapatkan token pembayaran')
        return
      }

      setSnapToken(token)

      if (window.snap) {
        openSnap(token)
      } else {
        const script = document.createElement('script')
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
        script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '')
        script.onload = () => openSnap(token)
        document.head.appendChild(script)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memuat pembayaran'
      toast.error(msg)
    } finally {
      setPaymentLoading(false)
    }
  }

  const openSnap = (token) => {
    window.snap.pay(token, {
      onSuccess: () => {
        toast.success('Pembayaran berhasil!')
        navigate(`/orders/${orderId}`)
      },
      onPending: () => {
        toast('Menunggu pembayaran...', { icon: '⏳' })
        navigate(`/orders/${orderId}`)
      },
      onError: () => {
        toast.error('Pembayaran gagal')
        navigate(`/orders/${orderId}`)
      },
      onClose: () => {
        toast('Pembayaran belum selesai. Bayar sebelum pesanan expired.', { icon: '⚠️' })
      }
    })
  }

  const handlePayNow = () => {
    if (snapToken) {
      openSnap(snapToken)
    } else if (orderId) {
      paymentTriggered.current = false
      triggerPayment(order?.order_id || orderId)
    }
  }

  return (
    <div className="success-outer" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 32,
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .success-outer { padding: 16px !important; align-items: flex-start !important; padding-top: 24px !important; }
          .success-card { padding: 28px 20px !important; }
          .success-h1 { font-size: 1.5rem !important; }
          .success-actions { flex-direction: column !important; }
          .success-actions button { width: 100% !important; justify-content: center !important; }
        }
      `}</style>
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

        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div style={{
          fontSize: '0.65rem', fontWeight: 800,
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: '#22c55e', marginBottom: 12
        }}>Pesanan Berhasil Dibuat</div>

        <h1 className="success-h1" style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 900, letterSpacing: '-0.03em',
          textTransform: 'uppercase', marginBottom: 16
        }}>SELESAIKAN PEMBAYARAN</h1>

        <p style={{
          color: 'var(--text-muted)', fontSize: '0.88rem',
          lineHeight: 1.8, marginBottom: 36, fontWeight: 400
        }}>
          Pesanan kamu sudah dibuat. Selesaikan pembayaran QRIS sebelum waktu habis.
        </p>

        {order && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: 24,
            marginBottom: 24, textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 4
                }}>KODE PESANAN</div>
                <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{order.order_code}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 4
                }}>TOTAL</div>
                <div style={{ fontWeight: 900, color: 'var(--accent-red)', fontSize: '0.95rem' }}>
                  {formatRupiah(order.total_price)}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-default)', marginBottom: 16 }} />

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
          </div>
        )}

        <button
          onClick={handlePayNow}
          disabled={paymentLoading}
          style={{
            width: '100%', padding: '15px',
            background: paymentLoading ? 'var(--bg-elevated)' : 'var(--accent-red)',
            color: paymentLoading ? 'var(--text-muted)' : 'white',
            borderRadius: 'var(--radius-sm)', fontWeight: 800,
            fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            border: 'none', cursor: paymentLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: paymentLoading ? 'none' : '0 4px 20px rgba(240,46,41,0.35)',
            transition: 'all 0.3s ease', marginBottom: 12
          }}>
          {paymentLoading
            ? <><Loader2 size={16} style={{ animation: 'rotate-slow 0.8s linear infinite' }} /> MEMUAT PEMBAYARAN...</>
            : <><ShoppingBag size={14} /> BAYAR SEKARANG</>
          }
        </button>

        <div className="success-actions" style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/')}
            style={{
              flex: 1, padding: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', fontWeight: 800,
              fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
            <Home size={14} /> BERANDA
          </button>
          <button onClick={() => navigate('/orders')}
            style={{
              flex: 2, padding: '12px',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', fontWeight: 800,
              fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
            LIHAT PESANAN <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}