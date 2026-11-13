import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import api from '../../api/axios'

// Nomor lokal (08xx) -> format internasional wa.me (628xx)
export const toWaNumber = (phone) => {
  const d = String(phone || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('62')) return d
  if (d.startsWith('0')) return '62' + d.slice(1)
  return '62' + d
}

// Kartu "Hubungi admin via WhatsApp". Nomor diambil dari data toko (stores.phone).
// storeId (opsional): toko pickup pesanan; kalau kosong/tidak ketemu pakai toko aktif pertama yang punya nomor.
export default function AdminContactCard({ orderCode, storeId }) {
  const [phone, setPhone] = useState('')

  useEffect(() => {
    let alive = true
    api.get('/stores')
      .then(res => {
        const list = res.data.stores || []
        const own = storeId ? list.find(s => s.store_id === storeId && s.phone) : null
        const store = own || list.find(s => s.phone)
        if (alive && store) setPhone(toWaNumber(store.phone))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [storeId])

  if (!phone) return null

  const text = orderCode
    ? `Halo admin Decant Temcy, saya ada kendala pengiriman untuk pesanan ${orderCode}.`
    : 'Halo admin Decant Temcy, saya ada kendala pengiriman pesanan saya.'
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(37,211,102,0.12)', color: '#25D366',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <MessageCircle size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Ada kendala pengiriman?</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
            Hubungi admin lewat WhatsApp, kami bantu cek pesananmu.
          </div>
        </div>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{
          padding: '10px 18px', background: '#25D366', color: '#fff', borderRadius: 'var(--radius-sm)',
          fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          textDecoration: 'none', whiteSpace: 'nowrap'
        }}>
        Chat Admin
      </a>
    </div>
  )
}
