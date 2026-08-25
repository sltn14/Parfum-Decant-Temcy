import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_notes: ''
  })

  useEffect(() => {
    fetchCart()
    if (user) {
      setForm(prev => ({
        ...prev,
        shipping_name: user.full_name || '',
        shipping_phone: user.phone || ''
      }))
    }
  }, [])

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart')
      setCart(res.data.cart)
      if (!res.data.cart?.items?.length) {
        toast.error('Keranjang kosong')
        navigate('/cart')
      }
    } catch {
      navigate('/cart')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/orders/checkout', form)
      toast.success('Order berhasil dibuat!')
      navigate(`/success?order_id=${res.data.order.order_id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout gagal')
    } finally {
      setSubmitting(false)
    }
  }

  const total = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.88rem',
    outline: 'none', fontFamily: 'var(--font-sans)',
    fontWeight: 500, transition: 'border-color 0.2s ease'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.62rem', fontWeight: 800,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 8
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
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 32px' }}>

        {/* Header */}
        <button onClick={() => navigate('/cart')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 32, color: 'var(--text-muted)', cursor: 'pointer',
          fontSize: '0.72rem', fontWeight: 800,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          transition: 'color 0.2s ease'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} /> KEMBALI KE KERANJANG
        </button>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 10
          }}>Checkout</div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase'
          }}>SELESAIKAN PESANAN</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>

            {/* Left — Form */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 32
            }}>
              <div style={{
                fontSize: '0.68rem', fontWeight: 800,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-default)'
              }}>INFORMASI PENGIRIMAN</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Nama Penerima</label>
                  <input type="text" name="shipping_name"
                    value={form.shipping_name} onChange={handleChange}
                    placeholder="Nama lengkap" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>No. HP</label>
                  <input type="tel" name="shipping_phone"
                    value={form.shipping_phone} onChange={handleChange}
                    placeholder="08xxxxxxxxxx" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Kota</label>
                <input type="text" name="shipping_city"
                  value={form.shipping_city} onChange={handleChange}
                  placeholder="Kota tujuan" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Alamat Lengkap</label>
                <textarea name="shipping_address"
                  value={form.shipping_address} onChange={handleChange}
                  placeholder="Jl. nama jalan, no. rumah, RT/RW, kelurahan, kecamatan"
                  required rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>
                  Catatan <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span>
                </label>
                <textarea name="shipping_notes"
                  value={form.shipping_notes} onChange={handleChange}
                  placeholder="Catatan untuk penjual..."
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                />
              </div>

              {/* Payment Method */}
              <div style={{
                fontSize: '0.68rem', fontWeight: 800,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-default)'
              }}>METODE PEMBAYARAN</div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px',
                background: 'rgba(240,46,41,0.06)',
                border: '1px solid rgba(240,46,41,0.2)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-red)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 900,
                  letterSpacing: '0.08em', color: 'white'
                }}>QRIS</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: 3 }}>QRIS</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    Scan QR code setelah order dibuat
                  </div>
                </div>
                <div style={{
                  marginLeft: 'auto', width: 18, height: 18,
                  borderRadius: '50%', background: 'var(--accent-red)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                </div>
              </div>
            </div>

            {/* Right — Summary */}
            <div>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: 28,
                position: 'sticky', top: 'calc(var(--navbar-height) + 24px)'
              }}>
                <div style={{
                  fontSize: '0.68rem', fontWeight: 800,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 24
                }}>RINGKASAN PESANAN</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {cart?.items?.map(item => (
                    <div key={item.cart_item_id} style={{
                      display: 'flex', gap: 12, alignItems: 'center'
                    }}>
                      <div style={{
                        width: 44, height: 44, flexShrink: 0,
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', border: '1px solid var(--border-default)'
                      }}>🧴</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 2 }}>
                          {item.product?.product_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {item.size_ml}ml × {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>
                        {formatRupiah(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)',
                  marginBottom: 20
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>{formatRupiah(total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Ongkos Kirim</span>
                    <span style={{ fontWeight: 700, color: '#22c55e' }}>GRATIS</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                  padding: '16px 0', borderTop: '1px solid var(--border-default)', marginBottom: 24
                }}>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 800,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'var(--text-muted)'
                  }}>TOTAL BAYAR</div>
                  <div style={{
                    fontSize: '1.4rem', fontWeight: 900,
                    color: 'var(--accent-red)', letterSpacing: '-0.02em'
                  }}>{formatRupiah(total)}</div>
                </div>

                <button type="submit" disabled={submitting}
                  style={{
                    width: '100%', padding: '15px',
                    background: submitting ? 'var(--border-hover)' : 'var(--accent-red)',
                    color: 'white', fontWeight: 800, fontSize: '0.78rem',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    borderRadius: 'var(--radius-sm)', border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: submitting ? 'none' : '0 4px 20px rgba(240,46,41,0.35)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    if (!submitting) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 28px rgba(240,46,41,0.45)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = submitting ? 'none' : '0 4px 20px rgba(240,46,41,0.35)'
                  }}>
                  <ShoppingBag size={16} />
                  {submitting ? 'MEMPROSES...' : 'BUAT PESANAN'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}