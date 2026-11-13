const Product = require('../modules/products/product.model');

const SIZES = [1, 2, 3, 5, 10];

const toMl = (v) => Number(v) || 0;

// Sumber kebenaran stok = products.stock_ml (sisa ml botol besar).
// Kolom stock_1ml..stock_5ml adalah data lama dan TIDAK dipakai lagi untuk menentukan bisa dibeli atau tidak.

// Berapa pcs ukuran `size` ml yang masih bisa dibeli dari sisa `stockMl`.
const maxQtyForSize = (stockMl, size) => {
  const s = parseInt(size);
  if (!SIZES.includes(s)) return 0;
  return Math.max(0, Math.floor(toMl(stockMl) / s));
};

// Total ml yang dibutuhkan sekumpulan item ({ size_ml, quantity }).
const mlNeeded = (items = []) =>
  items.reduce((sum, i) => sum + (parseInt(i.size_ml) || 0) * (parseInt(i.quantity) || 0), 0);

// Set stok botol besar (ml) + naikkan stock_ml_initial kalau kurang.
const mlFields = (stockMl, currentInitial = 0) => {
  const total = Math.max(0, toMl(stockMl));
  const initial = parseFloat(currentInitial) || 0;
  return { stock_ml: total, stock_ml_initial: Math.max(initial, total) };
};

// Kurangi/kembalikan stok ml untuk `qtyDelta` pcs ukuran `size_ml`.
// qtyDelta negatif = terjual, positif = dikembalikan (order batal).
const adjustMl = async (product, size_ml, qtyDelta, soldDelta = 0, options = {}) => {
  const size = parseInt(size_ml);
  if (!SIZES.includes(size)) return;

  const next = Math.max(0, toMl(product.stock_ml) + size * qtyDelta);
  await product.update({
    stock_ml: next,
    sold_count: Math.max(0, (product.sold_count || 0) + soldDelta),
    stock_ml_initial: Math.max(toMl(product.stock_ml_initial), next)
  }, options);
};

// Kembalikan stok ml saat order dibatalkan.
// `items` = order.items (OrderItem[]). Panggil HANYA sekali per order,
// yaitu saat status berubah menjadi 'cancelled'.
const restoreStockMl = async (items = [], options = {}) => {
  // Urut product_id + kunci baris (FOR UPDATE) saat di dalam transaksi: urutan kunci
  // sama dengan checkout sehingga tidak deadlock, dan tidak ada lost update stok.
  const sorted = [...items].sort((a, b) => a.product_id - b.product_id);
  for (const item of sorted) {
    const product = await Product.findByPk(item.product_id, {
      ...options,
      ...(options.transaction && { lock: options.transaction.LOCK.UPDATE })
    });
    if (!product) continue;
    await adjustMl(product, item.size_ml, item.quantity, -item.quantity, options);
  }
};

module.exports = { SIZES, maxQtyForSize, mlNeeded, mlFields, adjustMl, restoreStockMl };
