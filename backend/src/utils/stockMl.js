const Product = require('../modules/products/product.model');

const SIZES = [1, 2, 3, 5];

// Hitung stock_ml (total ml dari semua vial) + naikkan stock_ml_initial kalau kurang.
// `vials` = object berisi stock_1ml, stock_2ml, stock_3ml, stock_5ml.
// Rumus: 1ml x jumlah + 2ml x jumlah + 3ml x jumlah + 5ml x jumlah
const mlFields = (vials, currentInitial = 0) => {
  const total = SIZES.reduce((sum, s) => sum + s * (parseInt(vials[`stock_${s}ml`]) || 0), 0);
  const initial = parseFloat(currentInitial) || 0;
  return { stock_ml: total, stock_ml_initial: Math.max(initial, total) };
};

// Tambah/kurangi stok vial satu ukuran, lalu sinkronkan stock_ml & sold_count.
// delta negatif = terjual, positif = dikembalikan (order batal).
const adjustVials = async (product, size_ml, delta, soldDelta = 0) => {
  const size = parseInt(size_ml);
  if (!SIZES.includes(size)) return;

  const key = `stock_${size}ml`;
  const next = Math.max(0, (parseInt(product[key]) || 0) + delta);
  const vials = { ...product.get(), [key]: next };

  await product.update({
    [key]: next,
    sold_count: Math.max(0, (product.sold_count || 0) + soldDelta),
    ...mlFields(vials, product.stock_ml_initial)
  });
};

// Kembalikan stok vial saat order dibatalkan.
// `items` = order.items (OrderItem[]). Panggil HANYA sekali per order,
// yaitu saat status berubah menjadi 'cancelled'.
const restoreStockMl = async (items = []) => {
  for (const item of items) {
    const product = await Product.findByPk(item.product_id);
    if (!product) continue;
    await adjustVials(product, item.size_ml, item.quantity, -item.quantity);
  }
};

module.exports = { mlFields, adjustVials, restoreStockMl };