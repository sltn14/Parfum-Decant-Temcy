import { useLayoutEffect } from 'react'

// Di mobile, tabel di dalam elemen ber-class "rt-scope" ditampilkan sebagai kartu
// (tanpa scroll horizontal). Label tiap sel diambil otomatis dari teks <th>.
// Pemakaian: ref di <main className="rt-scope">, panggil useResponsiveTables(ref),
// dan sisipkan {RESPONSIVE_TABLE_CSS} di dalam <style>.

export function useResponsiveTables(ref) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return

    const label = () => {
      root.querySelectorAll('table').forEach(table => {
        const heads = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim())
        table.querySelectorAll('tbody tr').forEach(tr => {
          Array.from(tr.children).forEach((td, i) => {
            if (td.hasAttribute('colspan')) return
            const text = heads[i] || ''
            if (td.getAttribute('data-label') !== text) td.setAttribute('data-label', text)
          })
        })
      })
    }

    label()
    let raf = 0
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(label)
    })
    observer.observe(root, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [ref])
}

export const RESPONSIVE_TABLE_CSS = `
  @media (max-width: 768px) {
    html { font-size: 13px !important; }

    .rt-scope.rt-scope [class*="table-wrap"] {
      overflow: visible !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
    }
    .rt-scope.rt-scope table, .rt-scope.rt-scope tbody, .rt-scope.rt-scope tr, .rt-scope.rt-scope td {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }
    .rt-scope.rt-scope thead { display: none !important; }

    /* Tiap baris = kartu dengan grid 2 kolom (label di atas nilai) */
    .rt-scope.rt-scope tbody tr {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2px 14px;
      border: 1px solid var(--border-default) !important;
      border-radius: var(--radius-md, 10px);
      background: var(--bg-card);
      margin-bottom: 10px;
      padding: 8px 12px;
    }
    .rt-scope.rt-scope td {
      padding: 6px 0 !important;
      border: 0 !important;
      text-align: left !important;
      overflow-wrap: anywhere;
    }
    .rt-scope.rt-scope td::before {
      content: attr(data-label);
      display: block;
      margin-bottom: 3px;
      font-size: 0.56rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .rt-scope.rt-scope td[data-label=""]::before { content: none; }

    /* Sel lebar: kolom pertama (judul), terakhir (aksi), dan yang berisi input */
    .rt-scope.rt-scope td:first-child,
    .rt-scope.rt-scope td:last-child,
    .rt-scope.rt-scope td:has(input),
    .rt-scope.rt-scope td:has(select),
    .rt-scope.rt-scope td:has(textarea) { grid-column: 1 / -1; }

    .rt-scope.rt-scope td:last-child { padding-top: 8px !important; border-top: 1px dashed var(--border-default) !important; }
    .rt-scope.rt-scope td:last-child > div,
    .rt-scope.rt-scope td:last-child > button { flex-wrap: wrap; }

    .rt-scope.rt-scope td[colspan] {
      display: block !important;
      grid-column: 1 / -1;
      text-align: center !important;
      border-top: 0 !important;
    }
    .rt-scope.rt-scope td[colspan]::before { content: none; }
  }
`