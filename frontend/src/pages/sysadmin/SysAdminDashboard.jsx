import { useState, useEffect, useRef } from 'react'
import { Database, Mail, Bot, Server, Users, Clock, Shield } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function SysAdminDashboard() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)
  const [uptimeSeconds, setUptimeSeconds] = useState(0)
  const uptimeRef = useRef(null)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => {
      clearInterval(interval)
      if (uptimeRef.current) clearInterval(uptimeRef.current)
    }
  }, [])

  useEffect(() => {
    if (status && !loading) {
      setTimeout(() => setAnimated(true), 100)
      // Hitung uptime awal dari string backend
      const serverUptime = status?.status?.server?.uptime_seconds || 0
      setUptimeSeconds(serverUptime)
      // Jalankan timer real-time
      if (uptimeRef.current) clearInterval(uptimeRef.current)
      uptimeRef.current = setInterval(() => {
        setUptimeSeconds(prev => prev + 1)
      }, 1000)
    }
  }, [status, loading])

  const fetchStatus = async () => {
    try {
      const res = await api.get('/sysadmin/monitoring/status')
      setStatus(res.data)
    } catch {
      toast.error('Gagal memuat status sistem')
    } finally {
      setLoading(false)
    }
  }

  // Format uptime jadi HH:MM:SS
  const formatUptime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = Math.floor(totalSeconds % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const getStatusColor = (s) => {
    if (s === 'online') return '#22c55e'
    if (s === 'offline') return '#ef4444'
    return '#f59e0b'
  }

  const getStatusBg = (s) => {
    if (s === 'online') return 'rgba(34,197,94,0.08)'
    if (s === 'offline') return 'rgba(239,68,68,0.08)'
    return 'rgba(245,158,11,0.08)'
  }

  const getStatusBorder = (s) => {
    if (s === 'online') return 'rgba(34,197,94,0.2)'
    if (s === 'offline') return 'rgba(239,68,68,0.2)'
    return 'rgba(245,158,11,0.2)'
  }

  const getStatusLabel = (s) => {
    if (s === 'online') return 'ONLINE'
    if (s === 'offline') return 'OFFLINE'
    return 'UNKNOWN'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid var(--border-default)',
        borderTopColor: '#8b5cf6',
        animation: 'rotate-slow 0.8s linear infinite'
      }} />
    </div>
  )

  const serviceCards = [
    {
      label: 'DATABASE',
      icon: <Database size={20} />,
      status: status?.status?.database?.status,
      extra: status?.status?.database?.latency,
      color: '#3b82f6'
    },
    {
      label: 'EMAIL (SMTP)',
      icon: <Mail size={20} />,
      status: status?.status?.smtp?.status,
      color: '#f59e0b'
    },
    {
      label: 'AI SERVICE',
      icon: <Bot size={20} />,
      status: status?.status?.ai_service?.status,
      color: '#8b5cf6'
    }
  ]

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .sysadash-stats-grid { grid-template-columns: 1fr !important; }
          .sysadash-service-grid { grid-template-columns: 1fr !important; }
          .sysadash-server-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.62rem', fontWeight: 800,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#8b5cf6', marginBottom: 8
        }}>
          <Shield size={14} /> Administrator Sistem
        </div>
        <h1 style={{
          fontSize: '1.8rem', fontWeight: 900,
          letterSpacing: '-0.02em', textTransform: 'uppercase'
        }}>DASHBOARD</h1>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
          Status layanan diperbarui otomatis setiap 30 detik
        </div>
      </div>

      {/* Stats Cards */}
      <div className="sysadash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          {
            label: 'USER AKTIF HARI INI',
            value: status?.stats?.active_users_today || 0,
            icon: <Users size={18} />,
            color: '#22c55e',
            display: `${status?.stats?.active_users_today || 0} user`
          },
          {
            label: 'TOTAL PENGGUNA',
            value: status?.stats?.total_users || 0,
            icon: <Users size={18} />,
            color: '#3b82f6',
            display: `${status?.stats?.total_users || 0} user`
          },
          {
            label: 'SERVER UPTIME',
            value: formatUptime(uptimeSeconds),
            icon: <Clock size={18} />,
            color: '#8b5cf6',
            isText: true
          }
        ].map(({ label, value, icon, color, display, isText }, i) => (
          <div key={label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: '20px 22px',
            opacity: animated ? 1 : 0,
            transform: animated ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: -16, right: -16,
              width: 64, height: 64, borderRadius: '50%',
              background: color + '12', pointerEvents: 'none'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {label}
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: color + '15', color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                {icon}
              </div>
            </div>
            <div style={{
              fontSize: isText ? '1.5rem' : '2rem',
              fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums' // angka tidak bergeser saat update
            }}>
              {isText ? value : display}
            </div>
          </div>
        ))}
      </div>

      {/* Service Status */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 20
      }}>
        <div style={{
          fontSize: '0.65rem', fontWeight: 800,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--text-primary)', marginBottom: 20
        }}>STATUS LAYANAN</div>

        <div className="sysadash-service-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {serviceCards.map(({ label, icon, status: s, extra, color }) => (
            <div key={label} style={{
              padding: '18px 20px',
              background: getStatusBg(s),
              border: `1px solid ${getStatusBorder(s)}`,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                background: color + '15', color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>{icon}</div>
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 900, color: getStatusColor(s), letterSpacing: '0.06em' }}>
                  {getStatusLabel(s)}
                </div>
                {extra && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Latency: {extra}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Server Info */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: 28
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.65rem', fontWeight: 800,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--text-primary)', marginBottom: 16
        }}>
          <Server size={14} /> INFORMASI SERVER
        </div>
        <div className="sysadash-server-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Platform', value: status?.status?.server?.platform },
            { label: 'Node.js Version', value: status?.status?.server?.node_version },
            { label: 'Memory Usage', value: status?.status?.server?.memory },
            { label: 'Uptime Real-time', value: formatUptime(uptimeSeconds) }
          ].map(({ label, value }) => (
            <div key={label} style={{
              padding: '14px 16px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700,
                fontVariantNumeric: 'tabular-nums'
              }}>{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}