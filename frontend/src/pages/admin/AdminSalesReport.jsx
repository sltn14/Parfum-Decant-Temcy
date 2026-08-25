import { useState, useEffect } from 'react'
import { TrendingUp, Download } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export default function AdminSalesReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(dateRange)
      const res = await api.get(`/admin/sales-report?${params}`)
      setReport(res.data)
    } catch {
      toast.error('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  // Hitung produk terlaris dari orders
  const getTopProducts = () => {
    if (!report?.orders) return []
    const productMap = {}
    report.orders.forEach(order => {
      order.items?.forEach(item => {
        const key = item.product_name
        if (!productMap[key]) {
          productMap[key] = { name: item.product_name, qty: 0, revenue: 0 }
        }
        productMap[key].qty += item.quantity
        productMap[key].revenue += item.price * item.quantity
      })
    })
    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  const topProducts = getTopProducts()

  const inputStyle = {
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)'
        }}>
          Laporan Penjualan
        </h1>
      </div>

      {/* Filter Tanggal */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 24, marginBottom: 24,
        display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
            Dari Tanggal
          </label>
          <input type="date" value={dateRange.start_date}
            onChange={e => setDateRange({ ...dateRange, start_date: e.target.value })}
            style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, marginBottom: 6, color: 'var(--text-muted)' }}>
            Sampai Tanggal
          </label>
          <input type="date" value={dateRange.end_date}
            onChange={e => setDateRange({ ...dateRange, end_date: e.target.value })}
            style={inputStyle} />
        </div>
        <button onClick={fetchReport}
          style={{
            padding: '10px 24px',
            background: 'var(--accent-red)', color: 'white',
            borderRadius: 'var(--radius-md)', fontWeight: 600,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
          <TrendingUp size={16} /> Tampilkan
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Memuat laporan...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20, marginBottom: 32
          }}>
            {[
              {
                label: 'Total Revenue',
                value: formatRupiah(report?.totalRevenue || 0),
                color: '#22c55e', bg: 'rgba(34,197,94,0.1)'
              },
              {
                label: 'Total Pesanan Selesai',
                value: `${report?.totalOrders || 0} order`,
                color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'
              },
              {
                label: 'Rata-rata per Order',
                value: report?.totalOrders > 0
                  ? formatRupiah(report.totalRevenue / report.totalOrders)
                  : formatRupiah(0),
                color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'
              }
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: 24
              }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  {label}
                </p>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* Top Products */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24
            }}>
              <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>
                Produk Terlaris
              </h2>
              {topProducts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Belum ada data penjualan
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topProducts.map((p, i) => (
                    <div key={i}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: 6, fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 20, height: 20,
                            background: i < 3 ? 'var(--accent-red)' : 'var(--bg-elevated)',
                            color: i < 3 ? 'white' : 'var(--text-muted)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700, flexShrink: 0
                          }}>{i + 1}</span>
                          <span style={{ fontWeight: 500 }}>{p.name}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: 'var(--accent-red)' }}>
                            {formatRupiah(p.revenue)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {p.qty} terjual
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{
                        height: 4, background: 'var(--bg-elevated)',
                        borderRadius: 2, overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(p.revenue / topProducts[0].revenue) * 100}%`,
                          height: '100%',
                          background: i < 3 ? 'var(--accent-red)' : 'var(--border-hover)',
                          borderRadius: 2
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24
            }}>
              <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>
                Transaksi Selesai
              </h2>
              {!report?.orders?.length ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Belum ada transaksi selesai
                </p>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  maxHeight: 400, overflowY: 'auto'
                }}>
                  {report.orders.map(order => (
                    <div key={order.order_id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '10px 0',
                      borderBottom: '1px solid var(--border-default)',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{order.order_code}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#22c55e' }}>
                        {formatRupiah(order.total_price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  )
}