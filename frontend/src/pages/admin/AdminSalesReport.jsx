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
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { fetchReport() }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(dateRange)
      const res = await api.get(`/admin/sales-report?${params}`)
      setReport(res.data)
    } catch { toast.error('Gagal memuat laporan') }
    finally { setLoading(false) }
  }

  const getTopProducts = () => {
    if (!report?.orders) return []
    const map = {}
    report.orders.forEach(order => {
      order.items?.forEach(item => {
        if (!map[item.product_name]) {
          map[item.product_name] = { name: item.product_name, brand: item.brand, qty: 0, revenue: 0 }
        }
        map[item.product_name].qty += item.quantity
        map[item.product_name].revenue += item.price * item.quantity
      })
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }

  const topProducts = getTopProducts()

  const inputStyle = {
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
    outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: '0.62rem', fontWeight: 800,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--accent-red)', marginBottom: 8
        }}>Analitik</div>
        <h1 style={{
          fontWeight: 900, fontSize: '1.8rem',
          letterSpacing: '-0.02em', textTransform: 'uppercase',
          color: 'var(--text-primary)'
        }}>LAPORAN PENJUALAN</h1>
      </div>

      {/* Filter */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px', marginBottom: 24,
        display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap'
      }}>
        {[
          { label: 'DARI TANGGAL', key: 'start_date' },
          { label: 'SAMPAI TANGGAL', key: 'end_date' }
        ].map(({ label, key }) => (
          <div key={key}>
            <label style={{
              display: 'block', fontSize: '0.58rem', fontWeight: 800,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text-muted)', marginBottom: 6
            }}>{label}</label>
            <input type="date" value={dateRange[key]}
              onChange={e => setDateRange(prev => ({ ...prev, [key]: e.target.value }))}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
          </div>
        ))}
        <button onClick={fetchReport}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px',
            background: 'var(--accent-red)', color: 'white',
            borderRadius: 'var(--radius-sm)', fontWeight: 800,
            fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(240,46,41,0.3)'
          }}>
          <TrendingUp size={14} /> TAMPILKAN
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--accent-red)',
            animation: 'rotate-slow 0.8s linear infinite'
          }} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16, marginBottom: 24
          }}>
            {[
              {
                label: 'TOTAL REVENUE',
                value: formatRupiah(report?.totalRevenue || 0),
                color: '#22c55e', bg: 'rgba(34,197,94,0.06)'
              },
              {
                label: 'PESANAN SELESAI',
                value: `${report?.totalOrders || 0} order`,
                color: '#3b82f6', bg: 'rgba(59,130,246,0.06)'
              },
              {
                label: 'RATA-RATA / ORDER',
                value: report?.totalOrders > 0
                  ? formatRupiah(Math.floor(report.totalRevenue / report.totalOrders))
                  : formatRupiah(0),
                color: '#f59e0b', bg: 'rgba(245,158,11,0.06)'
              }
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: '20px 24px',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: -16, right: -16,
                  width: 80, height: 80, borderRadius: '50%',
                  background: bg
                }} />
                <div style={{
                  fontSize: '0.58rem', fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 12
                }}>{label}</div>
                <div style={{
                  fontSize: value.length > 12 ? '1rem' : '1.4rem',
                  fontWeight: 900, color, letterSpacing: '-0.02em'
                }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Top Products */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24
            }}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-primary)', marginBottom: 20
              }}>PRODUK TERLARIS</div>

              {topProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Belum ada data penjualan
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topProducts.map((p, i) => (
                    <div key={i}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 7
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 'var(--radius-xs)',
                            background: i < 3 ? 'var(--accent-red)' : 'var(--bg-elevated)',
                            color: i < 3 ? 'white' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.62rem', fontWeight: 900, flexShrink: 0
                          }}>{i + 1}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2 }}>{p.name}</div>
                            <div style={{
                              fontSize: '0.62rem', fontWeight: 800,
                              letterSpacing: '0.08em', textTransform: 'uppercase',
                              color: 'var(--accent-red)', marginTop: 2
                            }}>{p.brand}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#22c55e' }}>
                            {formatRupiah(p.revenue)}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {p.qty} terjual
                          </div>
                        </div>
                      </div>
                      <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(p.revenue / topProducts[0].revenue) * 100}%`,
                          height: '100%',
                          background: i < 3 ? 'var(--accent-red)' : 'var(--border-hover)',
                          borderRadius: 2, transition: '600ms ease'
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
              <div style={{
                fontSize: '0.65rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-primary)', marginBottom: 20
              }}>TRANSAKSI SELESAI</div>

              {!report?.orders?.length ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Belum ada transaksi selesai
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 0,
                  maxHeight: 380, overflowY: 'auto'
                }}>
                  {report.orders.map((order, i) => (
                    <div key={order.order_id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '11px 0',
                      borderBottom: i < report.orders.length - 1 ? '1px solid var(--border-default)' : 'none'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>
                          {order.order_code}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: 800, color: '#22c55e', fontSize: '0.85rem'
                      }}>
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