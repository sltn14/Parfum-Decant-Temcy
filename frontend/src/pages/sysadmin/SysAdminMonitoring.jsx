import { useState, useEffect } from 'react'
import { Activity, RefreshCw, Database, Mail, Bot, Server, AlertTriangle, Info, X } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function SysAdminMonitoring() {
  const [status, setStatus] = useState(null)
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [levelFilter, setLevelFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { fetchLogs() }, [page, levelFilter])

  const fetchAll = async () => {
    setLoading(true)
    setLoadingLogs(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (levelFilter) params.set('level', levelFilter)
      const [statusRes, logsRes] = await Promise.all([
        api.get('/sysadmin/monitoring/status'),
        api.get(`/sysadmin/monitoring/logs?${params}`)
      ])
      setStatus(statusRes.data)
      setLogs(logsRes.data.logs)
      setTotal(logsRes.data.total)
      setTotalPages(logsRes.data.totalPages)
    } catch { toast.error('Gagal memuat data monitoring') }
    finally {
      setLoading(false)
      setLoadingLogs(false)
    }
  }

  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (levelFilter) params.set('level', levelFilter)
      const res = await api.get(`/sysadmin/monitoring/logs?${params}`)
      setLogs(res.data.logs)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch {}
    finally { setLoadingLogs(false) }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
    toast.success('Data diperbarui!')
  }

  const getStatusColor = (s) => {
    if (s === 'online') return '#22c55e'
    if (s === 'offline') return '#ef4444'
    return '#f59e0b'
  }

  const getLevelConfig = (level) => {
    if (level === 'error') return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: <X size={12} /> }
    if (level === 'warning') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: <AlertTriangle size={12} /> }
    return { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: <Info size={12} /> }
  }

  const services = [
    { label: 'Database', icon: <Database size={16} />, key: 'database', color: '#3b82f6', extra: status?.status?.database?.latency },
    { label: 'SMTP Email', icon: <Mail size={16} />, key: 'smtp', color: '#f59e0b' },
    { label: 'AI Service', icon: <Bot size={16} />, key: 'ai_service', color: '#8b5cf6' },
  ]

  // Skeleton card
  const SkeletonCard = () => (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: 14
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: 10, background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ width: '40%', height: 14, background: 'var(--bg-elevated)', borderRadius: 4 }} />
      </div>
    </div>
  )

  return (
    <div>
      <style>{`
        .sysmon-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
        .sysmon-h1 { font-weight: 900; font-size: 1.8rem; letter-spacing: -0.02em; text-transform: uppercase; margin: 0; }
        .sysmon-refresh-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border: 1px solid var(--border-default);
          border-radius: var(--radius-sm); color: var(--text-secondary);
          font-weight: 800; font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase;
          transition: all 0.2s ease;
        }
        @media (max-width: 768px) {
          .sysmon-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; margin-bottom: 20px !important; }
          .sysmon-h1 { font-size: 1.3rem !important; }
          .sysmon-refresh-btn { width: 100% !important; justify-content: center !important; }
          .sysmon-service-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .sysmon-service-grid > div { padding: 12px !important; gap: 10px !important; }
          .sysmon-service-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; }
          .sysmon-server-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .sysmon-log-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .sysmon-log-filter { flex-wrap: wrap !important; gap: 6px !important; }
          .sysmon-card { padding: 16px !important; }
        }
      `}</style>

      <div className="sysmon-header">
        <div>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#8b5cf6', marginBottom: 8
          }}>Administrator Sistem</div>
          <h1 className="sysmon-h1">MONITORING SISTEM</h1>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="sysmon-refresh-btn"
          style={{
            background: refreshing ? 'var(--border-hover)' : 'var(--bg-card)',
            cursor: refreshing ? 'not-allowed' : 'pointer'
          }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'rotate-slow 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'MEMPERBARUI...' : 'REFRESH'}
        </button>
      </div>

      {/* Status Layanan */}
      {loading ? (
        <>
          <div className="sysmon-service-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24
          }}>
            <div style={{ width: 160, height: 12, background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 16 }} />
            <div className="sysmon-server-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                  padding: '12px 14px', background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)'
                }}>
                  <div style={{ width: '50%', height: 8, background: 'var(--bg-card)', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: '80%', height: 12, background: 'var(--bg-card)', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : status ? (
        <>
          <div className="sysmon-service-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            {services.map(({ label, icon, key, color, extra }) => {
              const s = status?.status?.[key]?.status
              return (
                <div key={key} style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${s === 'online' ? 'rgba(34,197,94,0.2)' : s === 'offline' ? 'rgba(239,68,68,0.2)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-lg)', padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: 14
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                    background: color + '15', color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: getStatusColor(s),
                        animation: s === 'online' ? 'pulse-glow-sm 2s infinite' : 'none'
                      }} />
                      <span style={{ fontWeight: 900, fontSize: '0.85rem', color: getStatusColor(s) }}>
                        {s === 'online' ? 'ONLINE' : s === 'offline' ? 'OFFLINE' : 'UNKNOWN'}
                      </span>
                    </div>
                    {extra && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>Latency: {extra}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--text-primary)', marginBottom: 16
            }}>
              <Server size={14} /> INFORMASI SERVER
            </div>
            <div className="sysmon-server-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Platform', value: status?.status?.server?.platform },
                { label: 'Node.js', value: status?.status?.server?.node_version },
                { label: 'Memory', value: status?.status?.server?.memory },
                { label: 'Uptime', value: status?.status?.server?.uptime },
                { label: 'User Aktif Hari Ini', value: `${status?.stats?.active_users_today || 0} user` },
                { label: 'Total Pengguna', value: `${status?.stats?.total_users || 0} user` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: '12px 14px', background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)'
                }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Log Sistem */}
      <div className="sysmon-card" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', padding: 24
      }}>
        <div className="sysmon-log-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: '#8b5cf6' }} />
            <div style={{
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-primary)'
            }}>LOG AKTIVITAS SISTEM</div>
          </div>
          <div className="sysmon-log-filter" style={{ display: 'flex', gap: 8 }}>
            {['', 'info', 'warning', 'error'].map(level => (
              <button key={level} onClick={() => { setLevelFilter(level); setPage(1) }}
                style={{
                  padding: '6px 12px',
                  background: levelFilter === level ? '#8b5cf6' : 'var(--bg-elevated)',
                  border: `1px solid ${levelFilter === level ? 'transparent' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-xs)',
                  color: levelFilter === level ? 'white' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: '0.62rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}>
                {level === '' ? 'SEMUA' : level.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loadingLogs ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            MEMUAT LOG...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Belum ada log aktivitas
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map(log => {
              const config = getLevelConfig(log.level)
              return (
                <div key={log.log_id} style={{
                  padding: '12px 16px', background: config.bg,
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${config.color}20`,
                  display: 'flex', gap: 12, alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: config.color + '20', color: config.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1
                  }}>{config.icon}</div>
                  <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {log.message}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {log.source && <span>Sumber: <strong>{log.source}</strong></span>}
                      <span>{new Date(log.createdAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 'var(--radius-xs)',
                    fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em',
                    color: config.color, background: config.color + '15', flexShrink: 0
                  }}>{log.level.toUpperCase()}</span>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '7px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>← PREV</button>
            <span style={{ padding: '7px 14px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '7px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>NEXT →</button>
          </div>
        )}
      </div>
    </div>
  )
}