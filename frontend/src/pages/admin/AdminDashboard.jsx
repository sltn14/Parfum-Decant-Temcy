import { useState, useEffect } from 'react'
import { Users, Package, ShoppingBag, TrendingUp } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

const STATUS_CONFIG = {
  pending: { label: 'Menunggu Bayar', color: '#f59e0b' },
  paid: { label: 'Dibayar', color: '#3b82f6' },
  processing: { label: 'Diproses', color: '#8b5cf6' },
  shipped: { label: 'Dikirim', color: '#06b6d4' },
  delivered: { label: 'Selesai', color: '#22c55e' },
  cancelled: { label: 'Dibatalkan', color: '#ef4444' }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard')
      setStats(res.data)
    } catch {
      toast.error('Gagal memuat dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--text-muted)' }}>Memuat dashboard...</div>
    </div>
  )

  const statCards = [
    {
      label: 'Total Pengguna', value: stats?.stats?.totalUsers || 0,
      icon: <Users size={24} />, color: '#3b82f6', suffix: 'user'
    },
    {
      label: 'Total Produk', value: stats?.stats?.totalProducts || 0,
      icon: <Package size={24} />, color: '#8b5cf6', suffix: 'produk'
    },
    {
      label: 'Total Pesanan', value: stats?.stats?.totalOrders || 0,
      icon: <ShoppingBag size={24} />, color: '#f59e0b', suffix: 'order'
    },
    {
      label: 'Total Revenue', value: formatRupiah(stats?.stats?.totalRevenue || 0),
      icon: <TrendingUp size={24} />, color: '#22c55e', isRupiah: true
    }
  ]

  return (
    <div>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.8rem', fontWeight: 700, marginBottom: 32,
        color: 'var(--text-primary)'
      }}>Dashboard</h1>

      {/* Stat Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20, marginBottom: 40
      }}>
        {statCards.map(({ label, value, icon, color, suffix, isRupiah }) => (
          <div key={label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  {label}
                </p>
                <p style={{ fontSize: isRupiah ? '1.1rem' : '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {value}
                </p>
                {suffix && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {suffix}
                  </p>
                )}
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: `${color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color
              }}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Recent Orders */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: 24
        }}>
          <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>
            Pesanan Terbaru
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats?.recentOrders?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada pesanan</p>
            ) : (
              stats?.recentOrders?.map(order => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                return (
                  <div key={order.order_id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '10px 0',
                    borderBottom: '1px solid var(--border-default)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                        {order.order_code}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {order.user?.full_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        {formatRupiah(order.total_price)}
                      </div>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        color: status.color,
                        background: `${status.color}20`,
                        padding: '2px 8px', borderRadius: 'var(--radius-full)'
                      }}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Orders by Status */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: 24
        }}>
          <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>
            Status Pesanan
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats?.ordersByStatus?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada data</p>
            ) : (
              stats?.ordersByStatus?.map(({ status, count }) => {
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
                const total = stats?.ordersByStatus?.reduce((sum, s) => sum + parseInt(s.count), 0)
                const percentage = Math.round((parseInt(count) / total) * 100)
                return (
                  <div key={status}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: 6, fontSize: '0.85rem'
                    }}>
                      <span style={{ color: config.color, fontWeight: 600 }}>
                        {config.label}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div style={{
                      height: 6, background: 'var(--bg-elevated)',
                      borderRadius: 3, overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`, height: '100%',
                        background: config.color, borderRadius: 3,
                        transition: '500ms ease'
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}