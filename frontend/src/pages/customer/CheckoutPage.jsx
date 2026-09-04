import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, MapPin, Plus, Tag, X, ChevronDown, Truck, Store } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const COURIERS = ['jne', 'jnt', 'sicepat', 'cod']

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Delivery method
  const [deliveryMethod, setDeliveryMethod] = useState('delivery')

  // Address
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [manualAddress, setManualAddress] = useState({
    shipping_name: '', shipping_phone: '',
    shipping_address: '', shipping_city: '', shipping_notes: ''
  })
  const [useManual, setUseManual] = useState(false)

  // Shipping
  const [courier, setCourier] = useState('')
  const [courierServices, setCourierServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [loadingCost, setLoadingCost] = useState(false)

  // Voucher
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [checkingVoucher, setCheckingVoucher] = useState(false)

  useEffect(() => {
    fetchCart()
    fetchAddresses()
    if (user) {
      setManualAddress(prev => ({
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
    } catch { navigate('/cart') }
    finally { setLoading(false) }
  }

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses')
      setAddresses(res.data.addresses)
      const def = res.data.addresses.find(a => a.is_default)
      if (def) setSelectedAddressId(def.address_id)
    } catch {}
  }

  const handleCourierChange = async (selectedCourier) => {
    setCourier(selectedCourier)
    setSelectedService(null)
    setCourierServices([])

    // COD langsung set tanpa API call
    if (selectedCourier === 'cod') {
      setCourierServices([{
        service: 'COD',
        description: 'Cash on Delivery - Owner antar langsung',
        cost: [{ value: 0, etd: '1', note: 'Area tertentu saja' }]
      }])
      return
    }

    const selectedAddr = addresses.find(a => a.address_id === selectedAddressId)
    if (!selectedAddr?.city_id) {
      toast.error('Pilih alamat dengan kota yang valid')
      return
    }

    setLoadingCost(true)
    try {
      const totalWeight = cart.items.reduce((sum, item) => sum + (50 * item.quantity), 0)
      const res = await api.post('/shipping/cost', {
        destination: selectedAddr.city_id,
        weight: totalWeight,
        courier: selectedCourier
      })
      setCourierServices(res.data.costs)
    } catch { toast.error('Gagal menghitung ongkir') }
    finally { setLoadingCost(false) }
  }

  const handleCheckVoucher = async () => {
    if (!voucherCode.trim()) return
    setCheckingVoucher(true)
    try {
      const res = await api.post('/vouchers/check', {
        code: voucherCode,
        total_price: subtotal
      })
      setAppliedVoucher(res.data.voucher)
      toast.success(`Voucher berhasil! Diskon ${formatRupiah(res.data.voucher.discount)}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Voucher tidak valid')
      setAppliedVoucher(null)
    } finally {
      setCheckingVoucher(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        delivery_method: deliveryMethod,
        voucher_code: appliedVoucher?.code || null,
        discount_amount: appliedVoucher?.discount || 0
      }

      if (deliveryMethod === 'delivery') {
        if (!useManual && selectedAddressId) {
          // Pakai alamat tersimpan — tidak perlu validasi manual
          payload.address_id = selectedAddressId
          if (selectedService) {
            payload.courier = courier
            payload.courier_service = selectedService.service
            payload.shipping_cost = selectedService.cost[0].value
          }
        } else if (useManual) {
          // Pakai alamat manual — validasi dulu
          if (!manualAddress.shipping_name || !manualAddress.shipping_phone ||
              !manualAddress.shipping_address || !manualAddress.shipping_city) {
            toast.error('Lengkapi semua data pengiriman')
            setSubmitting(false)
            return
          }
          payload.shipping_name = manualAddress.shipping_name
          payload.shipping_phone = manualAddress.shipping_phone
          payload.shipping_address = manualAddress.shipping_address
          payload.shipping_city = manualAddress.shipping_city
          payload.shipping_notes = manualAddress.shipping_notes || ''
          if (selectedService) {
            payload.courier = courier
            payload.courier_service = selectedService.service
            payload.shipping_cost = selectedService.cost[0].value
          }
        } else {
          toast.error('Pilih alamat pengiriman terlebih dahulu')
          setSubmitting(false)
          return
        }
      } else {
        // Pickup
        payload.shipping_name = user?.full_name || 'Pickup'
        payload.shipping_phone = user?.phone || '-'
        payload.shipping_address = 'Pickup di toko'
        payload.shipping_city = 'Semarang'
        payload.shipping_cost = 0
      }

      const res = await api.post('/orders/checkout', payload)
      toast.success('Order berhasil dibuat!')
      navigate(`/success?order_id=${res.data.order.order_id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout gagal')
    } finally {
      setSubmitting(false)
    }
  }

  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
  const shippingCost = deliveryMethod === 'pickup' ? 0 : (selectedService?.cost[0]?.value || 0)
  const discount = appliedVoucher?.discount || 0
  const total = subtotal + shippingCost - discount

  const selectedAddress = addresses.find(a => a.address_id === selectedAddressId)

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
    outline: 'none', fontFamily: 'var(--font-sans)',
    fontWeight: 500, transition: 'border-color 0.2s ease'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.6rem', fontWeight: 800,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 6
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
          <ArrowLeft size={14} /> KEMBALI
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

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Delivery Method */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: 24
              }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 16,
                  paddingBottom: 14, borderBottom: '1px solid var(--border-default)'
                }}>METODE PENGIRIMAN</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { value: 'delivery', icon: <Truck size={20} />, label: 'DIKIRIM', desc: 'Kurir ke alamat kamu' },
                    { value: 'pickup', icon: <Store size={20} />, label: 'PICKUP', desc: 'Ambil di toko · GRATIS' }
                  ].map(({ value, icon, label, desc }) => (
                    <button key={value} type="button"
                      onClick={() => { setDeliveryMethod(value); setSelectedService(null); setCourier('') }}
                      style={{
                        padding: '16px',
                        background: deliveryMethod === value ? 'rgba(240,46,41,0.08)' : 'var(--bg-elevated)',
                        border: `1px solid ${deliveryMethod === value ? 'var(--accent-red)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}>
                      <div style={{
                        color: deliveryMethod === value ? 'var(--accent-red)' : 'var(--text-muted)',
                        marginBottom: 8
                      }}>{icon}</div>
                      <div style={{
                        fontWeight: 800, fontSize: '0.78rem',
                        letterSpacing: '0.1em',
                        color: deliveryMethod === value ? 'var(--accent-red)' : 'var(--text-secondary)',
                        marginBottom: 4
                      }}>{label}</div>
                      <div style={{
                        fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400
                      }}>{desc}</div>
                    </button>
                  ))}
                </div>

                {/* Pickup Info */}
                {deliveryMethod === 'pickup' && (
                  <div style={{
                    marginTop: 16, padding: '14px 16px',
                    background: 'rgba(34,197,94,0.04)',
                    border: '1px solid rgba(34,197,94,0.15)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{
                      fontSize: '0.65rem', fontWeight: 800,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: '#22c55e', marginBottom: 8
                    }}>INFO PICKUP</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 400 }}>
                      📍 Alamat Toko: <strong>Semarang, Jawa Tengah</strong><br />
                      🕐 Jam Operasional: <strong>Menunggu konfirmasi stakeholder</strong><br />
                      📱 Hubungi kami setelah order dibuat
                    </div>
                  </div>
                )}
              </div>

              {/* Address Section (only delivery) */}
              {deliveryMethod === 'delivery' && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)', padding: 24
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 16, paddingBottom: 14,
                    borderBottom: '1px solid var(--border-default)'
                  }}>
                    <div style={{
                      fontSize: '0.65rem', fontWeight: 800,
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: 'var(--text-muted)'
                    }}>ALAMAT PENGIRIMAN</div>
                    <button type="button"
                      onClick={() => setUseManual(!useManual)}
                      style={{
                        fontSize: '0.65rem', fontWeight: 800,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--accent-red)', cursor: 'pointer',
                        background: 'none', border: 'none'
                      }}>
                      {useManual ? 'PILIH DARI DAFTAR' : 'ISI MANUAL'}
                    </button>
                  </div>

                  {!useManual ? (
                    <>
                      {addresses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                            Belum ada alamat tersimpan
                          </p>
                          <button type="button"
                            onClick={() => navigate('/addresses')}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '10px 20px',
                              background: 'var(--accent-red)', color: 'white',
                              borderRadius: 'var(--radius-sm)', fontWeight: 800,
                              fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                              border: 'none', cursor: 'pointer'
                            }}>
                            <Plus size={13} /> TAMBAH ALAMAT
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {addresses.map(addr => (
                            <div key={addr.address_id}
                              onClick={() => {
                                setSelectedAddressId(addr.address_id)
                                setCourier('')
                                setSelectedService(null)
                                setCourierServices([])
                              }}
                              style={{
                                padding: '14px 16px',
                                background: selectedAddressId === addr.address_id ? 'rgba(240,46,41,0.06)' : 'var(--bg-elevated)',
                                border: `1px solid ${selectedAddressId === addr.address_id ? 'var(--accent-red)' : 'var(--border-default)'}`,
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer', transition: 'all 0.2s ease',
                                display: 'flex', gap: 12, alignItems: 'flex-start'
                              }}>
                              <div style={{
                                width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                background: selectedAddressId === addr.address_id ? 'var(--accent-red)' : 'var(--bg-elevated)',
                                border: `2px solid ${selectedAddressId === addr.address_id ? 'var(--accent-red)' : 'var(--border-hover)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                {selectedAddressId === addr.address_id && (
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                  <span style={{
                                    fontSize: '0.6rem', fontWeight: 800,
                                    letterSpacing: '0.1em', textTransform: 'uppercase',
                                    color: selectedAddressId === addr.address_id ? 'var(--accent-red)' : 'var(--text-muted)',
                                    padding: '2px 8px',
                                    background: selectedAddressId === addr.address_id ? 'rgba(240,46,41,0.1)' : 'var(--bg-card)',
                                    borderRadius: 'var(--radius-xs)'
                                  }}>{addr.label}</span>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{addr.recipient_name}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{addr.phone}</span>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 400 }}>
                                  {addr.detail}, {addr.city}, {addr.province}
                                </p>
                              </div>
                            </div>
                          ))}
                          <button type="button"
                            onClick={() => navigate('/addresses')}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '10px',
                              background: 'transparent',
                              border: '1px dashed var(--border-hover)',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--text-muted)', cursor: 'pointer',
                              justifyContent: 'center', fontSize: '0.72rem',
                              fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'var(--accent-red)'
                              e.currentTarget.style.color = 'var(--accent-red)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'var(--border-hover)'
                              e.currentTarget.style.color = 'var(--text-muted)'
                            }}>
                            <Plus size={13} /> TAMBAH ALAMAT BARU
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Nama Penerima</label>
                          <input type="text" value={manualAddress.shipping_name}
                            onChange={e => setManualAddress(prev => ({ ...prev, shipping_name: e.target.value }))}
                            required style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>No. HP</label>
                          <input type="tel" value={manualAddress.shipping_phone}
                            onChange={e => setManualAddress(prev => ({ ...prev, shipping_phone: e.target.value }))}
                            required style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Kota</label>
                        <input type="text" value={manualAddress.shipping_city}
                          onChange={e => setManualAddress(prev => ({ ...prev, shipping_city: e.target.value }))}
                          required style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Alamat Lengkap</label>
                        <textarea value={manualAddress.shipping_address}
                          onChange={e => setManualAddress(prev => ({ ...prev, shipping_address: e.target.value }))}
                          required rows={2} style={{ ...inputStyle, resize: 'vertical' }}
                          onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Catatan <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span></label>
                        <input type="text" value={manualAddress.shipping_notes}
                          onChange={e => setManualAddress(prev => ({ ...prev, shipping_notes: e.target.value }))}
                          style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Courier (only delivery) */}
              {deliveryMethod === 'delivery' && (selectedAddressId || useManual) && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)', padding: 24
                }}>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 800,
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', marginBottom: 16,
                    paddingBottom: 14, borderBottom: '1px solid var(--border-default)'
                  }}>PILIH KURIR</div>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {COURIERS.map(c => (
                      <button key={c} type="button"
                        onClick={() => handleCourierChange(c)}
                        style={{
                          flex: 1, padding: '10px',
                          background: courier === c ? 'rgba(240,46,41,0.08)' : 'var(--bg-elevated)',
                          border: `1px solid ${courier === c ? 'var(--accent-red)' : 'var(--border-default)'}`,
                          borderRadius: 'var(--radius-sm)',
                          color: courier === c ? 'var(--accent-red)' : 'var(--text-secondary)',
                          fontWeight: 800, cursor: 'pointer',
                          fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                          transition: 'all 0.2s ease'
                        }}>
                        {c.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {loadingCost && (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Menghitung ongkir...
                    </div>
                  )}

                  {courierServices.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {courierServices.map((service, i) => (
                        <div key={i}
                          onClick={() => setSelectedService(service)}
                          style={{
                            padding: '12px 14px',
                            background: selectedService?.service === service.service ? 'rgba(240,46,41,0.06)' : 'var(--bg-elevated)',
                            border: `1px solid ${selectedService?.service === service.service ? 'var(--accent-red)' : 'var(--border-default)'}`,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                          <div>
                            <span style={{
                              fontWeight: 800, fontSize: '0.8rem',
                              color: selectedService?.service === service.service ? 'var(--accent-red)' : 'var(--text-primary)'
                            }}>
                              {courier.toUpperCase()} {service.service}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 400, marginLeft: 8 }}>
                              {service.cost[0].etd} hari
                            </span>
                          </div>
                          <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>
                            {formatRupiah(service.cost[0].value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Voucher */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: 24
              }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 16,
                  paddingBottom: 14, borderBottom: '1px solid var(--border-default)'
                }}>VOUCHER / PROMO</div>

                {appliedVoucher ? (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '0.72rem', fontWeight: 800,
                        letterSpacing: '0.1em', color: '#22c55e', marginBottom: 2
                      }}>
                        ✓ {appliedVoucher.code}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Hemat {formatRupiah(appliedVoucher.discount)}
                      </div>
                    </div>
                    <button type="button" onClick={() => { setAppliedVoucher(null); setVoucherCode('') }}
                      style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text" placeholder="MASUKKAN KODE VOUCHER"
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                      style={{
                        flex: 1, padding: '12px 14px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)', fontSize: '0.82rem',
                        outline: 'none', fontFamily: 'var(--font-sans)',
                        fontWeight: 700, letterSpacing: '0.08em',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                    />
                    <button type="button" onClick={handleCheckVoucher} disabled={checkingVoucher || !voucherCode}
                      style={{
                        padding: '12px 20px',
                        background: voucherCode ? 'var(--accent-red)' : 'var(--border-hover)',
                        color: 'white', fontWeight: 800,
                        fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        borderRadius: 'var(--radius-sm)', border: 'none',
                        cursor: voucherCode ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease'
                      }}>
                      {checkingVoucher ? '...' : 'PAKAI'}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: 24
              }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 16,
                  paddingBottom: 14, borderBottom: '1px solid var(--border-default)'
                }}>METODE PEMBAYARAN</div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 16px',
                  background: 'rgba(240,46,41,0.06)',
                  border: '1px solid rgba(240,46,41,0.2)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-red)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.62rem', fontWeight: 900,
                    letterSpacing: '0.06em', color: 'white'
                  }}>QRIS</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 2 }}>QRIS</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      Scan QR setelah order dibuat
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Summary */}
            <div>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: 28,
                position: 'sticky', top: 'calc(var(--navbar-height) + 24px)'
              }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 20
                }}>RINGKASAN PESANAN</div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  {cart?.items?.map(item => (
                    <div key={item.cart_item_id} style={{
                      display: 'flex', gap: 10, alignItems: 'center'
                    }}>
                      <div style={{
                        width: 40, height: 40, flexShrink: 0,
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-default)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem'
                      }}>🧴</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 1 }}>
                          {item.product?.product_name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {item.size_ml}ml × {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>
                        {formatRupiah(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  height: 1, background: 'var(--border-default)', marginBottom: 16
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>{formatRupiah(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Ongkos Kirim</span>
                    <span style={{ fontWeight: 700, color: shippingCost === 0 ? '#22c55e' : 'var(--text-primary)' }}>
                      {shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>Diskon Voucher</span>
                      <span style={{ fontWeight: 700, color: '#22c55e' }}>-{formatRupiah(discount)}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                  padding: '14px 0', borderTop: '1px solid var(--border-default)', marginBottom: 20
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
                    if (!submitting) e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
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