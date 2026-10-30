import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Plus, X, Truck, Store } from 'lucide-react'
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
  const [deliveryMethod, setDeliveryMethod] = useState('delivery')
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [useManual, setUseManual] = useState(false)
  const [manualAddress, setManualAddress] = useState({
    shipping_name: '', shipping_phone: '',
    shipping_address: '', shipping_city: '', shipping_notes: ''
  })
  const [courier, setCourier] = useState('')
  const [courierServices, setCourierServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)

  // Store pickup (cabang)
  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [storesLoading, setStoresLoading] = useState(false)

  useEffect(() => {
    if (deliveryMethod !== 'pickup' || stores.length > 0) return
    setStoresLoading(true)
    api.get('/stores')
      .then(res => {
        const list = res.data.stores || []
        setStores(list)
        if (list.length > 0) setSelectedStoreId(prev => prev ?? list[0].store_id)
      })
      .catch(() => toast.error('Gagal memuat daftar store'))
      .finally(() => setStoresLoading(false))
  }, [deliveryMethod])
  const [loadingCost, setLoadingCost] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [checkingVoucher, setCheckingVoucher] = useState(false)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [availableVouchers, setAvailableVouchers] = useState([])
  const [loadingVouchers, setLoadingVouchers] = useState(false)
  const [voucherSearch, setVoucherSearch] = useState('')

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

  const getSubtotal = () =>
    cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0

  const handleCourierChange = async (selectedCourier) => {
    setCourier(selectedCourier)
    setSelectedService(null)
    setCourierServices([])

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
      toast.error('Pilih alamat dengan kota yang valid dulu')
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

  const handleCheckVoucher = async (codeToCheck = null) => {
    const code = codeToCheck || voucherCode
    if (!code || !code.trim()) {
      toast.error('Masukkan kode voucher dulu')
      return
    }
    setCheckingVoucher(true)
    try {
      const res = await api.post('/vouchers/check', {
        code: code.trim(),
        total_price: getSubtotal()
      })
      setAppliedVoucher(res.data.voucher)
      setVoucherCode(res.data.voucher.code)
      setShowVoucherModal(false)
      toast.success(`Voucher berhasil! Hemat ${formatRupiah(res.data.voucher.discount)}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Voucher tidak valid atau sudah habis')
    } finally {
      setCheckingVoucher(false)
    }
  }

  const fetchAvailableVouchers = async () => {
    setLoadingVouchers(true)
    try {
      const res = await api.get('/vouchers/active')
      setAvailableVouchers(res.data.vouchers || [])
    } catch {
      setAvailableVouchers([])
    } finally {
      setLoadingVouchers(false)
    }
  }

  const handleOpenVoucherModal = () => {
    setShowVoucherModal(true)
    setVoucherSearch('')
    fetchAvailableVouchers()
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
          payload.address_id = selectedAddressId
          if (selectedService) {
            payload.courier = courier
            payload.courier_service = selectedService.service
            payload.shipping_cost = selectedService.cost[0].value
          }
        } else if (useManual) {
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
        if (!selectedStoreId) {
          toast.error('Pilih store tempat pickup terlebih dahulu')
          setSubmitting(false)
          return
        }
        payload.shipping_name = user?.full_name || 'Pickup'
        payload.shipping_phone = user?.phone || '-'
        payload.pickup_store_id = selectedStoreId
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

  const subtotal = getSubtotal()
  const shippingCost = deliveryMethod === 'pickup' ? 0 : (selectedService?.cost[0]?.value || 0)
  const discount = appliedVoucher?.discount || 0
  const total = subtotal + shippingCost - discount

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
      <style>{`
        .checkout-page-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 48px 32px;
        }
        .checkout-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: color 0.2s ease;
          background: none;
          border: none;
        }
        .checkout-back-btn:hover { color: var(--text-primary); }
        .checkout-label-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent-red);
          margin-bottom: 10px;
        }
        .checkout-h1 {
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin: 0 0 40px 0;
        }
        .checkout-main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }
        .checkout-left-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .checkout-section-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 24px;
        }
        .checkout-section-title {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-default);
        }
        .checkout-method-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .checkout-method-btn {
          padding: 16px;
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }
        .checkout-method-icon {
          margin-bottom: 8px;
        }
        .checkout-method-label {
          font-weight: 800;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }
        .checkout-method-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 400;
        }
        .checkout-manual-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .checkout-courier-row {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        .checkout-courier-btn {
          flex: 1;
          padding: 10px;
          border-radius: var(--radius-sm);
          font-weight: 800;
          cursor: pointer;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }
        .checkout-address-name {
          font-weight: 700;
          font-size: 0.85rem;
        }
        .checkout-address-detail {
          color: var(--text-muted);
          font-size: 0.78rem;
        }
        .checkout-summary-panel {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 28px;
          position: sticky;
          top: calc(var(--navbar-height) + 24px);
        }
        .checkout-order-item {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }
        .checkout-order-item-name {
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 1px;
        }
        .checkout-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          margin-bottom: 10px;
        }
        .checkout-total-label {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .checkout-total {
          font-size: 1.4rem;
          font-weight: 900;
          color: var(--accent-red);
          letter-spacing: -0.02em;
        }
        .checkout-submit {
          width: 100%;
          padding: 15px;
          color: white;
          font-weight: 800;
          font-size: 0.78rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border-radius: var(--radius-sm);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }

        /* === MOBILE === */
        @media (max-width: 768px) {
          .checkout-page-wrap {
            padding: 20px 14px !important;
          }
          .checkout-back-btn {
            font-size: 0.6rem !important;
            margin-bottom: 16px !important;
          }
          .checkout-h1 {
            font-size: 1.25rem !important;
            margin-bottom: 20px !important;
          }
          .checkout-main-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .checkout-section-card {
            padding: 14px !important;
          }
          .checkout-section-title {
            font-size: 0.58rem !important;
            margin-bottom: 12px !important;
            padding-bottom: 10px !important;
          }
          .checkout-method-grid {
            gap: 8px !important;
          }
          .checkout-method-btn {
            padding: 12px !important;
          }
          .checkout-method-label {
            font-size: 0.65rem !important;
          }
          .checkout-method-desc {
            font-size: 0.6rem !important;
          }
          .checkout-manual-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .checkout-courier-row {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
          .checkout-courier-btn {
            flex: 1 1 calc(50% - 4px) !important;
            font-size: 0.6rem !important;
            padding: 10px 6px !important;
          }
          .checkout-address-name {
            font-size: 0.78rem !important;
          }
          .checkout-address-detail {
            font-size: 0.68rem !important;
          }
          .checkout-summary-panel {
            position: static !important;
            padding: 16px !important;
          }
          .checkout-order-item {
            gap: 8px !important;
          }
          .checkout-order-item-name {
            font-size: 0.68rem !important;
          }
          .checkout-summary-row {
            font-size: 0.72rem !important;
          }
          .checkout-total-label {
            font-size: 0.52rem !important;
          }
          .checkout-total {
            font-size: 1.1rem !important;
          }
          .checkout-submit {
            font-size: 0.7rem !important;
            padding: 12px !important;
          }
        }
      `}</style>
      <div className="checkout-page-wrap">

        <button className="checkout-back-btn" onClick={() => navigate('/cart')}>
          <ArrowLeft size={14} /> KEMBALI
        </button>

        <div className="checkout-label-tag">Checkout</div>
        <h1 className="checkout-h1">SELESAIKAN PESANAN</h1>

        <form onSubmit={handleSubmit}>
          <div className="checkout-main-grid">

            {/* LEFT */}
            <div className="checkout-left-col">

              {/* Delivery Method */}
              <div className="checkout-section-card">
                <div className="checkout-section-title">METODE PENGIRIMAN</div>

                <div className="checkout-method-grid">
                  {[
                    { value: 'delivery', icon: <Truck size={20} />, label: 'DIKIRIM', desc: 'Kurir ke alamat kamu' },
                    { value: 'pickup', icon: <Store size={20} />, label: 'PICKUP', desc: 'Ambil di toko · GRATIS' }
                  ].map(({ value, icon, label, desc }) => (
                    <button key={value} type="button" className="checkout-method-btn"
                      onClick={() => { setDeliveryMethod(value); setSelectedService(null); setCourier('') }}
                      style={{
                        background: deliveryMethod === value ? 'rgba(240,46,41,0.08)' : 'var(--bg-elevated)',
                        border: `1px solid ${deliveryMethod === value ? 'var(--accent-red)' : 'var(--border-default)'}`,
                      }}>
                      <div className="checkout-method-icon" style={{
                        color: deliveryMethod === value ? 'var(--accent-red)' : 'var(--text-muted)'
                      }}>{icon}</div>
                      <div className="checkout-method-label" style={{
                        color: deliveryMethod === value ? 'var(--accent-red)' : 'var(--text-secondary)'
                      }}>{label}</div>
                      <div className="checkout-method-desc">{desc}</div>
                    </button>
                  ))}
                </div>

                {deliveryMethod === 'pickup' && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{
                      fontSize: '0.65rem', fontWeight: 800,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: '#22c55e', marginBottom: 10
                    }}>PILIH STORE PICKUP</div>

                    {storesLoading ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Memuat daftar store...</div>
                    ) : stores.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Belum ada store aktif untuk pickup. Silakan pilih metode dikirim.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {stores.map(store => {
                          const active = selectedStoreId === store.store_id
                          return (
                            <button key={store.store_id} type="button"
                              onClick={() => setSelectedStoreId(store.store_id)}
                              style={{
                                display: 'flex', gap: 12, alignItems: 'flex-start',
                                textAlign: 'left', padding: '12px 14px', width: '100%',
                                background: active ? 'rgba(34,197,94,0.08)' : 'var(--bg-elevated)',
                                border: `1px solid ${active ? '#22c55e' : 'var(--border-default)'}`,
                                borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'inherit'
                              }}>
                              <span style={{
                                width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                border: `2px solid ${active ? '#22c55e' : 'var(--border-hover)'}`,
                                background: active ? '#22c55e' : 'transparent',
                                boxShadow: active ? 'inset 0 0 0 3px var(--bg-card)' : 'none'
                              }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 3 }}>{store.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 400 }}>
                                  📍 {store.address}, {store.city}
                                  {store.phone && <><br />📱 {store.phone}</>}
                                </div>
                                {store.maps_url && (
                                  <a href={store.maps_url} target="_blank" rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textDecoration: 'underline' }}>
                                    Lihat di Maps
                                  </a>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
                      📱 Hubungi store setelah order dibuat untuk konfirmasi waktu pengambilan
                    </div>
                  </div>
                )}
              </div>

              {/* Address */}
              {deliveryMethod === 'delivery' && (
                <div className="checkout-section-card">
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-default)'
                  }}>
                    <div style={{
                      fontSize: '0.65rem', fontWeight: 800,
                      letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)'
                    }}>ALAMAT PENGIRIMAN</div>
                    <button type="button" onClick={() => setUseManual(!useManual)}
                      style={{
                        fontSize: '0.65rem', fontWeight: 800,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--accent-red)', cursor: 'pointer', background: 'none', border: 'none'
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
                          <button type="button" onClick={() => navigate('/addresses')}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '10px 20px', background: 'var(--accent-red)', color: 'white',
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
                                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                transition: 'all 0.2s ease', display: 'flex', gap: 12, alignItems: 'flex-start'
                              }}>
                              <div style={{
                                width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                background: selectedAddressId === addr.address_id ? 'var(--accent-red)' : 'transparent',
                                border: `2px solid ${selectedAddressId === addr.address_id ? 'var(--accent-red)' : 'var(--border-hover)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                {selectedAddressId === addr.address_id && (
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '0.6rem', fontWeight: 800,
                                    letterSpacing: '0.1em', textTransform: 'uppercase',
                                    color: selectedAddressId === addr.address_id ? 'var(--accent-red)' : 'var(--text-muted)',
                                    padding: '2px 8px',
                                    background: selectedAddressId === addr.address_id ? 'rgba(240,46,41,0.1)' : 'var(--bg-card)',
                                    borderRadius: 'var(--radius-xs)'
                                  }}>{addr.label}</span>
                                  <span className="checkout-address-name" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{addr.recipient_name}</span>
                                  <span className="checkout-address-detail" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{addr.phone}</span>
                                </div>
                                <p className="checkout-address-detail" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 400 }}>
                                  {addr.detail}, {addr.city}, {addr.province}
                                </p>
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={() => navigate('/addresses')}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '10px',
                              background: 'transparent', border: '1px dashed var(--border-hover)',
                              borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer',
                              justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700,
                              letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s ease'
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
                      <div className="checkout-manual-grid">
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

              {/* Courier */}
              {deliveryMethod === 'delivery' && (selectedAddressId || useManual) && (
                <div className="checkout-section-card">
                  <div className="checkout-section-title">PILIH KURIR</div>

                  <div className="checkout-courier-row">
                    {COURIERS.map(c => (
                      <button key={c} type="button" className="checkout-courier-btn" onClick={() => handleCourierChange(c)}
                        style={{
                          background: courier === c ? 'rgba(240,46,41,0.08)' : 'var(--bg-elevated)',
                          border: `1px solid ${courier === c ? 'var(--accent-red)' : 'var(--border-default)'}`,
                          color: courier === c ? 'var(--accent-red)' : 'var(--text-secondary)',
                        }}>
                        {c === 'cod' ? 'COD' : c.toUpperCase()}
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
                        <div key={i} onClick={() => setSelectedService(service)}
                          style={{
                            padding: '12px 14px',
                            background: selectedService?.service === service.service ? 'rgba(240,46,41,0.06)' : 'var(--bg-elevated)',
                            border: `1px solid ${selectedService?.service === service.service ? 'var(--accent-red)' : 'var(--border-default)'}`,
                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            transition: 'all 0.2s ease',
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
                            {service.cost[0].value === 0 ? 'GRATIS' : formatRupiah(service.cost[0].value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Voucher */}
              <div className="checkout-section-card">
                <div className="checkout-section-title">VOUCHER / PROMO</div>

                {appliedVoucher ? (
                  <div style={{
                    padding: '14px 16px',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#22c55e', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#22c55e', letterSpacing: '0.08em' }}>
                          {appliedVoucher.code}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Hemat <strong style={{ color: '#22c55e' }}>{formatRupiah(appliedVoucher.discount)}</strong> dari total belanja
                      </div>
                    </div>
                    <button type="button"
                      onClick={() => { setAppliedVoucher(null); setVoucherCode('') }}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button type="button" onClick={handleOpenVoucherModal}
                      style={{
                        width: '100%', padding: '12px 16px',
                        background: 'var(--bg-elevated)',
                        border: '1px dashed var(--border-hover)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)', fontWeight: 700,
                        fontSize: '0.78rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
                      <span>🎁 Pilih atau masukkan voucher</span>
                      <span style={{ fontSize: '0.72rem' }}>›</span>
                    </button>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text" placeholder="KODE VOUCHER"
                        value={voucherCode}
                        onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCheckVoucher())}
                        style={{
                          flex: 1, padding: '11px 14px',
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
                      <button type="button" onClick={() => handleCheckVoucher()}
                        disabled={checkingVoucher || !voucherCode.trim()}
                        style={{
                          padding: '11px 18px',
                          background: voucherCode.trim() ? 'var(--accent-red)' : 'var(--border-hover)',
                          color: 'white', fontWeight: 800,
                          fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                          borderRadius: 'var(--radius-sm)', border: 'none',
                          cursor: voucherCode.trim() && !checkingVoucher ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s ease'
                        }}>
                        {checkingVoucher ? '...' : 'PAKAI'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="checkout-section-card">
                <div className="checkout-section-title">METODE PEMBAYARAN</div>

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
                    letterSpacing: '0.06em', color: 'white', flexShrink: 0
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
              <div className="checkout-summary-panel">
                <div className="checkout-section-title" style={{ marginBottom: 20 }}>RINGKASAN PESANAN</div>

                <div style={{ marginBottom: 18 }}>
                  {cart?.items?.map(item => (
                    <div key={item.cart_item_id} className="checkout-order-item">
                      <div style={{
                        width: 40, height: 40, flexShrink: 0,
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-default)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', overflow: 'hidden'
                      }}>
                        {item.product?.image_filename && item.product.image_filename !== 'default.png' ? (
                          <img
                            src={`http://localhost:5000/uploads/products/${item.product.image_filename}`}
                            alt={item.product?.product_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : '🧴'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="checkout-order-item-name">{item.product?.product_name}</div>
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

                <div style={{ height: 1, background: 'var(--border-default)', marginBottom: 16 }} />

                <div style={{ marginBottom: 16 }}>
                  <div className="checkout-summary-row">
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Ongkos Kirim</span>
                    <span style={{ fontWeight: 700, color: shippingCost === 0 ? '#22c55e' : 'var(--text-primary)' }}>
                      {shippingCost === 0 ? 'GRATIS' : formatRupiah(shippingCost)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="checkout-summary-row">
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>Diskon Voucher</span>
                      <span style={{ fontWeight: 700, color: '#22c55e' }}>-{formatRupiah(discount)}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                  padding: '14px 0', borderTop: '1px solid var(--border-default)', marginBottom: 20
                }}>
                  <div className="checkout-total-label">TOTAL BAYAR</div>
                  <div className="checkout-total">{formatRupiah(total)}</div>
                </div>

                <button type="submit" disabled={submitting} className="checkout-submit"
                  style={{
                    background: submitting ? 'var(--border-hover)' : 'var(--accent-red)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: submitting ? 'none' : '0 4px 20px rgba(240,46,41,0.35)',
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
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

      {/* Voucher Modal */}
      {showVoucherModal && (
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
            width: '100%', maxWidth: 480,
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            animation: 'scaleIn 0.2s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{
                fontWeight: 900, fontSize: '0.95rem',
                textTransform: 'uppercase', letterSpacing: '-0.01em'
              }}>PILIH VOUCHER</h3>
              <button type="button" onClick={() => setShowVoucherModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-default)' }}>
              <input
                type="text" placeholder="Cari atau ketik kode voucher..."
                value={voucherSearch}
                onChange={e => setVoucherSearch(e.target.value.toUpperCase())}
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)', fontSize: '0.85rem',
                  outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500,
                  letterSpacing: '0.04em'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {loadingVouchers ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid var(--border-default)',
                    borderTopColor: 'var(--accent-red)',
                    animation: 'rotate-slow 0.8s linear infinite',
                    margin: '0 auto 12px'
                  }} />
                  <div style={{ fontSize: '0.82rem' }}>Memuat voucher...</div>
                </div>
              ) : availableVouchers.filter(v =>
                !voucherSearch || v.code.includes(voucherSearch)
              ).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {voucherSearch ? `Voucher "${voucherSearch}" tidak ditemukan` : 'Tidak ada voucher tersedia saat ini'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {availableVouchers
                    .filter(v => !voucherSearch || v.code.includes(voucherSearch))
                    .map(v => {
                      const sub = getSubtotal()
                      const canUse = sub >= v.min_purchase
                      const isSelected = appliedVoucher?.code === v.code

                      let previewDiscount = 0
                      if (canUse) {
                        if (v.type === 'percentage') {
                          previewDiscount = Math.floor(sub * (v.value / 100))
                          if (v.max_discount) previewDiscount = Math.min(previewDiscount, v.max_discount)
                        } else {
                          previewDiscount = Math.min(v.value, sub)
                        }
                      }

                      return (
                        <div key={v.voucher_id} style={{
                          padding: '16px', position: 'relative', overflow: 'hidden',
                          background: canUse
                            ? (isSelected ? 'rgba(34,197,94,0.06)' : 'var(--bg-elevated)')
                            : 'var(--bg-elevated)',
                          border: `1px solid ${isSelected ? '#22c55e' : canUse ? 'var(--border-default)' : 'var(--border-default)'}`,
                          borderRadius: 'var(--radius-md)',
                          opacity: canUse ? 1 : 0.55
                        }}>
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                            background: canUse ? (isSelected ? '#22c55e' : 'var(--accent-red)') : 'var(--border-hover)',
                            borderRadius: '4px 0 0 4px'
                          }} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                <span style={{
                                  fontSize: '0.88rem', fontWeight: 900,
                                  color: canUse ? (isSelected ? '#22c55e' : 'var(--accent-red)') : 'var(--text-muted)',
                                  letterSpacing: '0.06em'
                                }}>{v.code}</span>
                                {v.expired_at && (
                                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    s/d {new Date(v.expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {v.type === 'percentage'
                                  ? `Diskon ${v.value}%${v.max_discount ? ` (maks. ${formatRupiah(v.max_discount)})` : ''}`
                                  : `Diskon ${formatRupiah(v.value)}`}
                              </div>

                              {v.min_purchase > 0 && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 3 }}>
                                  Min. belanja {formatRupiah(v.min_purchase)}
                                  {!canUse && (
                                    <span style={{ color: '#f59e0b', fontWeight: 700, marginLeft: 6 }}>
                                      · kurang {formatRupiah(v.min_purchase - sub)}
                                    </span>
                                  )}
                                </div>
                              )}

                              {canUse && previewDiscount > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 800, marginBottom: 3 }}>
                                  Hemat {formatRupiah(previewDiscount)}
                                </div>
                              )}

                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                Sisa {v.quota - v.used_count} kuota
                              </div>
                            </div>

                            <button type="button"
                              disabled={!canUse || checkingVoucher}
                              onClick={() => {
                                if (!canUse) return
                                setVoucherCode(v.code)
                                handleCheckVoucher(v.code)
                              }}
                              style={{
                                padding: '8px 14px', marginLeft: 12, flexShrink: 0, alignSelf: 'center',
                                background: !canUse ? 'var(--bg-card)' : isSelected ? '#22c55e' : 'var(--accent-red)',
                                color: !canUse ? 'var(--text-muted)' : 'white',
                                border: `1px solid ${!canUse ? 'var(--border-default)' : isSelected ? '#22c55e' : 'transparent'}`,
                                borderRadius: 'var(--radius-sm)', fontWeight: 800,
                                fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                                cursor: canUse && !checkingVoucher ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease'
                              }}>
                              {checkingVoucher && voucherCode === v.code ? '...' : isSelected ? 'TERPAKAI' : canUse ? 'PAKAI' : 'BELUM BISA'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Footer input manual */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex', gap: 8
            }}>
              <input
                type="text" placeholder="Punya kode lain? Ketik di sini..."
                value={voucherSearch}
                onChange={e => {
                  setVoucherSearch(e.target.value.toUpperCase())
                  setVoucherCode(e.target.value.toUpperCase())
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && voucherSearch.trim()) {
                    e.preventDefault()
                    handleCheckVoucher(voucherSearch)
                  }
                }}
                style={{
                  flex: 1, padding: '11px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)', fontSize: '0.82rem',
                  outline: 'none', fontFamily: 'var(--font-sans)',
                  fontWeight: 600, letterSpacing: '0.06em'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
              <button type="button"
                onClick={() => handleCheckVoucher(voucherSearch)}
                disabled={!voucherSearch.trim() || checkingVoucher}
                style={{
                  padding: '11px 18px',
                  background: voucherSearch.trim() ? 'var(--accent-red)' : 'var(--border-hover)',
                  color: 'white', fontWeight: 800,
                  fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  cursor: voucherSearch.trim() ? 'pointer' : 'not-allowed'
                }}>
                {checkingVoucher ? '...' : 'PAKAI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}