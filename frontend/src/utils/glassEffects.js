// Efek kaca interaktif: titik cahaya mengikuti kursor pada permukaan kaca (kartu, panel, navbar, modal).
// Cara kerja: satu listener `pointermove` untuk seluruh halaman, mencari permukaan kaca terdekat di bawah
// kursor, lalu mengisi variabel CSS --mx/--my. Gaya dan animasinya ada di index.css (bagian GLASS).

// Permukaan kaca utama (sama dengan daftar di index.css; kaca ringan seperti chip dan input tidak ikut efek kursor)
const GLASS_SELECTOR = [
  '[style*="--bg-card"]',
  '[style*="--glass-panel"]',
  '[style*="--glass-strong"]',
  '[style*="background: var(--glass)"]',
  '.kr-card',
  '.kr-modal',
  '.glass',
  '.ap-modal',
  '.ap-search-box',
  '.ap-table-wrap',
  '.cart-item-row',
  '.cart-summary',
  '.checkout-section-card',
  '.checkout-summary-panel',
  '.inv-table-wrap',
  '.orders-card',
  '.st-card',
  '.st-modal',
  '.cart-ctrl-qty'
].join(',');

// Elemen kecil yang boleh terangkat sedikit saat dihover (kartu besar/daftar panjang tidak)
const MAX_LIFT_AREA = 420 * 420;

let frame = 0;
let lastEvent = null;

const prepare = (el) => {
  if (el.dataset.glass !== undefined) return;
  el.dataset.glass = '';
  // ::after butuh induk berposisi; elemen yang sudah absolute/fixed/sticky dibiarkan
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const r = el.getBoundingClientRect();
  if (r.width * r.height <= MAX_LIFT_AREA) el.dataset.glassLift = '';
};

const update = () => {
  frame = 0;
  const e = lastEvent;
  if (!e || !e.target || !e.target.closest) return;
  const el = e.target.closest(GLASS_SELECTOR);
  if (!el) return;
  prepare(el);
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
};

export const initGlassEffects = () => {
  if (typeof window === 'undefined' || window.__glassInit) return;
  window.__glassInit = true;
  // Layar sentuh tidak punya hover: tidak perlu efek kursor
  try { if (window.matchMedia('(hover: none)').matches) return; } catch { /* abaikan */ }

  window.addEventListener('pointermove', (e) => {
    lastEvent = e;
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
};
