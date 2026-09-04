import { useState, useEffect, useRef } from 'react'
import { Users, Package, ShoppingBag, TrendingUp, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const STATUS_CONFIG = {
  pending: { label: 'MENUNGGU BAYAR', color: '#f59e0b' },
  paid: { label: 'DIBAYAR', color: '#3b82f6' },
  processing: { label: 'DIPROSES', color: '#8b5cf6' },
  shipped: { label: 'DIKIRIM', color: '#06b6d4' },
  delivered: { label: 'SELESAI', color: '#22c55e' },
  cancelled: { label: 'DIBATALKAN', color: '#ef4444' }
}

const useInView = (threshold = 0.1) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

const Counter = ({ end, prefix = '', suffix = '', duration = 1500, isRupiah = false }) => {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView])
  return (
    <span ref={ref}>
      {isRupiah
        ? formatRupiah(count)
        : `${prefix}${count.toLocaleString('id-ID')}${suffix}`}
    </span>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsRef, statsInView] = useInView()

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard')
      setStats(res.data)
    } catch { toast.error('Gagal memuat dashboard') }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid var(--border-default)',
        borderTopColor: 'var(--accent-red)',
        animation: 'rotate-slow 0.8s linear infinite'
      }} />
    </div>
  )

  const statCards = [
    {
      label: 'TOTAL PENGGUNA',
      value: stats?.stats?.totalUsers || 0,
      icon: <Users size={20} />,
      color: '#3b82f6',
      suffix: ' user',
      onClick: () => navigate('/admin/users')
    },
    {
      label: 'TOTAL PRODUK',
      value: stats?.stats?.totalProducts || 0,
      icon: <Package size={20} />,
      color: '#8b5cf6',
      suffix: ' produk',
      onClick: () => navigate('/admin/products')
    },
    {
      label: 'TOTAL PESANAN',
      value: stats?.stats?.totalOrders || 0,
      icon: <ShoppingBag size={20} />,
      color: '#f59e0b',
      suffix: ' order',
      onClick: () => navigate('/admin/orders')
    },
    {
      label: 'TOTAL REVENUE',
      value: stats?.stats?.totalRevenue || 0,
      icon: <TrendingUp size={20} />,
      color: '#22c55e',
      isRupiah: true,
      onClick: () => navigate('/admin/sales-report')
    }
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: '0.62rem', fontWeight: 800,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--accent-red)', marginBottom: 8
        }}>Overview</div>
        <h1 style={{
          fontSize: '1.8rem', fontWeight: 900,
          letterSpacing: '-0.02em', textTransform: 'uppercase',
          color: 'var(--text-primary)'
        }}>DASHBOARD</h1>
      </div>

      {/* Stat Cards */}
      <div ref={statsRef} style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: 36
      }}>
        {statCards.map(({ label, value, icon, color, suffix, isRupiah, onClick }, i) => (
          <div key={label}
            onClick={onClick}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: '20px 22px',
              cursor: 'pointer',
              opacity: statsInView ? 1 : 0,
              transform: statsInView ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.5s ease ${i * 0.08}s`,
              position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color + '40'
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* BG accent */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: color + '12'
            }} />

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 16
            }}>
              <div style={{
                fontSize: '0.58rem', fontWeight: 800,
                letterSpacing: '0.15em', color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}>{label}</div>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, position: 'relative', zIndex: 1
              }}>{icon}</div>
            </div>

            <div style={{
              fontSize: isRupiah ? '1rem' : '1.8rem',
              fontWeight: 900, letterSpacing: '-0.03em',
              color: 'var(--text-primary)', lineHeight: 1
            }}>
              <Counter
                end={value}
                isRupiah={isRupiah}
                suffix={!isRupiah ? suffix : ''}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Recent Orders */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: 24
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20
          }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--text-primary)'
            }}>PESANAN TERBARU</div>
            <button onClick={() => navigate('/admin/orders')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.62rem', fontWeight: 800,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--accent-red)', cursor: 'pointer',
                background: 'none', border: 'none'
              }}>
              LIHAT SEMUA <ArrowRight size={11} />
            </button>
          </div>

          {!stats?.recentOrders?.length ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Belum ada pesanan
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {stats.recentOrders.map((order, i) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                return (
                  <div key={order.order_id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '12px 0',
                    borderBottom: i < stats.recentOrders.length - 1 ? '1px solid var(--border-default)' : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>
                        {order.order_code}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {order.user?.full_name} · {new Date(order.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>
                        {formatRupiah(order.total_price)}
                      </div>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 800,
                        letterSpacing: '0.1em',
                        color: status.color,
                        background: status.color + '15',
                        padding: '2px 8px', borderRadius: 'var(--radius-xs)'
                      }}>{status.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: 24
        }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 800,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--text-primary)', marginBottom: 20
          }}>STATUS PESANAN</div>

          {!stats?.ordersByStatus?.length ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Belum ada data
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stats.ordersByStatus.map(({ status, count }) => {
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
                const total = stats.ordersByStatus.reduce((sum, s) => sum + parseInt(s.count), 0)
                const pct = Math.round((parseInt(count) / total) * 100)
                return (
                  <div key={status}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: 6, fontSize: '0.78rem'
                    }}>
                      <span style={{ color: config.color, fontWeight: 700, letterSpacing: '0.04em' }}>
                        {config.label}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        {count} <span style={{ opacity: 0.5 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{
                      height: 5, background: 'var(--bg-elevated)',
                      borderRadius: 3, overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: config.color, borderRadius: 3,
                        transition: '800ms cubic-bezier(0.4,0,0.2,1)'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}