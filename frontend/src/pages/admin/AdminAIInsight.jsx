import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Package, Users, ShoppingBag, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export default function AdminAIInsight() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [stats, setStats] = useState(null)
  const [insight, setInsight] = useState(null)
  const [lastGenerated, setLastGenerated] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dashRes, reportRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/sales-report')
      ])
      setStats({ dashboard: dashRes.data, report: reportRes.data })
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const generateInsight = async () => {
    if (!stats) return
    setGenerating(true)
    try {
      // Kirim data ke chatbot AI untuk analisis
      const { dashboard, report } = stats

      const topProducts = []
      if (report?.orders) {
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
        Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5).forEach(p => topProducts.push(p))
      }

      const prompt = `Kamu adalah AI business analyst untuk toko parfum decant bernama Decant Temcy.

Berikan analisis bisnis singkat dan rekomendasi actionable berdasarkan data berikut:

DATA PENJUALAN:
- Total Revenue: ${formatRupiah(dashboard?.stats?.totalRevenue || 0)}
- Total Pesanan: ${dashboard?.stats?.totalOrders || 0}
- Total User: ${dashboard?.stats?.totalUsers || 0}
- Total Produk: ${dashboard?.stats?.totalProducts || 0}

STATUS PESANAN:
${dashboard?.ordersByStatus?.map(s => `- ${s.status}: ${s.count} pesanan`).join('\n') || 'Tidak ada data'}

PRODUK TERLARIS:
${topProducts.map((p, i) => `${i + 1}. ${p.brand} ${p.name} - ${p.qty} terjual - ${formatRupiah(p.revenue)}`).join('\n') || 'Tidak ada data'}

Berikan dalam format:
1. RINGKASAN PERFORMA (2-3 kalimat)
2. INSIGHT UTAMA (3 poin)
3. REKOMENDASI AKSI (3 poin konkret)
4. PERINGATAN/PERHATIAN (jika ada)

Gunakan bahasa Indonesia yang profesional namun mudah dipahami. Fokus pada insight yang actionable untuk pemilik toko kecil.`

      const res = await api.post('/chatbot', {
        message: prompt,
        session_id: `admin-insight-${Date.now()}`
      })

      setInsight(res.data.reply)
      setLastGenerated(new Date())
      toast.success('AI Insight berhasil digenerate!')
    } catch (err) {
      // Kalau chatbot AI tidak tersedia, tampilkan insight manual
      generateManualInsight()
    } finally {
      setGenerating(false)
    }
  }

  const generateManualInsight = () => {
    const { dashboard } = stats
    const totalOrders = dashboard?.stats?.totalOrders || 0
    const totalRevenue = dashboard?.stats?.totalRevenue || 0
    const totalUsers = dashboard?.stats?.totalUsers || 0
    const ordersByStatus = dashboard?.ordersByStatus || []

    const cancelledOrders = ordersByStatus.find(s => s.status === 'cancelled')?.count || 0
    const cancelRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0
    const avgOrderValue = totalOrders > 0 ? Math.floor(totalRevenue / totalOrders) : 0
    const pendingOrders = ordersByStatus.find(s => s.status === 'pending')?.count || 0

    setInsight(`**RINGKASAN PERFORMA**
Decant Temcy telah berhasil melayani ${totalUsers} pengguna dengan total ${totalOrders} pesanan dan revenue sebesar ${formatRupiah(totalRevenue)}. Rata-rata nilai per transaksi adalah ${formatRupiah(avgOrderValue)}.

**INSIGHT UTAMA**
- Tingkat pembatalan pesanan saat ini ${cancelRate}% dari total pesanan${cancelRate > 20 ? ' — perlu perhatian lebih' : ' — dalam batas wajar'}.
- Terdapat ${pendingOrders} pesanan yang menunggu pembayaran. Follow up ke pelanggan untuk meningkatkan konversi.
- Basis pengguna ${totalUsers} orang adalah aset penting — manfaatkan dengan program loyalitas dan notifikasi promo.

**REKOMENDASI AKSI**
- Kirimkan reminder pembayaran ke pelanggan dengan pesanan pending lebih dari 24 jam.
- Buat voucher diskon khusus untuk pelanggan yang sudah pernah bertransaksi (repeat buyer).
- Tambahkan lebih banyak varian produk berdasarkan preferensi aroma pengguna yang terdaftar.

**PERINGATAN/PERHATIAN**
${cancelRate > 20 ? `⚠️ Tingkat pembatalan ${cancelRate}% cukup tinggi. Pertimbangkan untuk menambahkan reminder pembayaran otomatis.` : '✓ Semua metrik dalam kondisi normal. Pertahankan kualitas layanan!'}`)

    setLastGenerated(new Date())
    toast.success('Insight berhasil digenerate!')
  }

  // Parse insight text jadi sections
  const parseInsight = (text) => {
    if (!text) return []
    const sections = []
    const lines = text.split('\n')
    let current = null

    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return

      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        if (current) sections.push(current)
        current = { title: trimmed.replace(/\*\*/g, ''), points: [] }
      } else if (current) {
        current.points.push(trimmed.replace(/^[•\-\*]\s*/, ''))
      }
    })
    if (current) sections.push(current)
    return sections
  }

  const sectionIcons = {
    'RINGKASAN PERFORMA': <TrendingUp size={16} />,
    'INSIGHT UTAMA': <Sparkles size={16} />,
    'REKOMENDASI AKSI': <Package size={16} />,
    'PERINGATAN/PERHATIAN': <ShoppingBag size={16} />
  }

  const sectionColors = {
    'RINGKASAN PERFORMA': '#3b82f6',
    'INSIGHT UTAMA': '#8b5cf6',
    'REKOMENDASI AKSI': '#22c55e',
    'PERINGATAN/PERHATIAN': '#f59e0b'
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

  const sections = parseInsight(insight)

  return (
    <div>
      <style>{`
        .ai-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; }
        .ai-h1 {
          font-weight: 900; font-size: 1.8rem;
          letter-spacing: -0.02em; text-transform: uppercase;
          color: var(--text-primary); margin: 0;
        }
        .ai-generate-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 22px;
          font-weight: 800; font-size: 0.72rem;
          letter-spacing: 0.12em; text-transform: uppercase;
          border-radius: var(--radius-sm); border: none;
          transition: all 0.3s ease;
        }
        .ai-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 32px;
        }
        .ai-insight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) {
          .ai-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            margin-bottom: 20px !important;
          }
          .ai-h1 { font-size: 1.3rem !important; }
          .ai-generate-btn { width: 100% !important; justify-content: center !important; }
          .ai-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .ai-insight-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="ai-header">
        <div>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 8
          }}>Analitik Cerdas</div>
          <h1 className="ai-h1">AI INSIGHT</h1>
          {lastGenerated && (
            <div style={{
              fontSize: '0.72rem', color: 'var(--text-muted)',
              fontWeight: 500, marginTop: 6
            }}>
              Terakhir diperbarui: {lastGenerated.toLocaleString('id-ID')}
            </div>
          )}
        </div>
        <button onClick={generateInsight} disabled={generating}
          className="ai-generate-btn"
          style={{
            background: generating ? 'var(--border-hover)' : 'var(--accent-red)',
            color: 'white',
            cursor: generating ? 'not-allowed' : 'pointer',
            boxShadow: generating ? 'none' : '0 4px 14px rgba(240,46,41,0.3)',
          }}>
          {generating
            ? <><RefreshCw size={14} style={{ animation: 'rotate-slow 1s linear infinite' }} /> GENERATING...</>
            : <><Sparkles size={14} /> GENERATE INSIGHT</>
          }
        </button>
      </div>

      {/* Stats summary cards */}
      <div className="ai-stats-grid">
        {[
          { label: 'TOTAL REVENUE', value: formatRupiah(stats?.dashboard?.stats?.totalRevenue || 0), color: '#22c55e', icon: <TrendingUp size={18} /> },
          { label: 'TOTAL PESANAN', value: `${stats?.dashboard?.stats?.totalOrders || 0} order`, color: '#3b82f6', icon: <ShoppingBag size={18} /> },
          { label: 'TOTAL USER', value: `${stats?.dashboard?.stats?.totalUsers || 0} user`, color: '#8b5cf6', icon: <Users size={18} /> },
          { label: 'TOTAL PRODUK', value: `${stats?.dashboard?.stats?.totalProducts || 0} produk`, color: '#f59e0b', icon: <Package size={18} /> }
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: '18px 20px',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: -16, right: -16,
              width: 64, height: 64, borderRadius: '50%',
              background: color + '12'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                fontSize: '0.58rem', fontWeight: 800,
                letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase'
              }}>{label}</div>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                background: color + '15', color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, position: 'relative', zIndex: 1
              }}>{icon}</div>
            </div>
            <div style={{
              fontWeight: 900, fontSize: value.length > 12 ? '0.95rem' : '1.3rem',
              color: 'var(--text-primary)', letterSpacing: '-0.02em'
            }}>{value}</div>
          </div>
        ))}
      </div>

      {/* AI Insight Result */}
      {!insight ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-hover)',
          borderRadius: 'var(--radius-lg)', padding: '64px 32px',
          textAlign: 'center'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(240,46,41,0.08)',
            border: '1px solid rgba(240,46,41,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Sparkles size={28} style={{ color: 'var(--accent-red)' }} />
          </div>
          <h3 style={{
            fontWeight: 900, fontSize: '1rem',
            textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 10
          }}>BELUM ADA INSIGHT</h3>
          <p style={{
            color: 'var(--text-muted)', fontSize: '0.85rem',
            lineHeight: 1.8, marginBottom: 28, fontWeight: 400, maxWidth: 400, margin: '0 auto 28px'
          }}>
            Klik tombol <strong>Generate Insight</strong> untuk mendapatkan analisis bisnis berbasis AI dari data penjualan kamu.
          </p>
          <button onClick={generateInsight} disabled={generating}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px',
              background: 'var(--accent-red)', color: 'white',
              fontWeight: 800, fontSize: '0.75rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(240,46,41,0.3)'
            }}>
            <Sparkles size={15} /> GENERATE INSIGHT SEKARANG
          </button>
        </div>
      ) : (
        <div className="ai-insight-grid">
          {sections.map((section, i) => {
            const color = sectionColors[section.title] || 'var(--accent-red)'
            const icon = sectionIcons[section.title] || <Sparkles size={16} />
            return (
              <div key={i} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${color}25`,
                borderRadius: 'var(--radius-lg)', padding: 24,
                animation: `fadeInUp 0.4s ease ${i * 0.1}s both`
              }}>
                {/* Section header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 16, paddingBottom: 12,
                  borderBottom: `1px solid ${color}20`
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                    background: color + '15', color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{icon}</div>
                  <div style={{
                    fontSize: '0.68rem', fontWeight: 800,
                    letterSpacing: '0.15em', textTransform: 'uppercase', color
                  }}>{section.title}</div>
                </div>

                {/* Points */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {section.points.map((point, j) => (
                    <div key={j} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      fontSize: '0.85rem', color: 'var(--text-secondary)',
                      lineHeight: 1.7, fontWeight: 400
                    }}>
                      {section.points.length > 1 && (
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: color, flexShrink: 0, marginTop: 8
                        }} />
                      )}
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Refresh hint */}
      {insight && (
        <div style={{
          marginTop: 20, textAlign: 'center',
          fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500
        }}>
          Data insight berdasarkan kondisi saat ini. Klik <strong>Generate Insight</strong> untuk memperbarui.
        </div>
      )}
    </div>
  )
}