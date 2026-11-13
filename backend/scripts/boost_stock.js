// Naikkan stock_ml semua produk uji ke nilai besar, lalu kembalikan setelah uji.
//   ALLOW_LOADTEST_DATA=true node scripts/boost_stock.js boost [LOAD_STOCK_ML=1000000]
//   ALLOW_LOADTEST_DATA=true node scripts/boost_stock.js restore
// Nilai asli disimpan di scripts/.stock_backup.json (jangan dihapus sebelum restore).
const { guard, intEnv } = require('./_loadtestGuard');
guard();

const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/database');
const Product = require('../src/modules/products/product.model');

const BACKUP = path.join(__dirname, '.stock_backup.json');

(async () => {
  const mode = process.argv[2];
  try {
    await sequelize.authenticate();
    if (mode === 'boost') {
      if (fs.existsSync(BACKUP)) {
        console.error('Dibatalkan: backup lama masih ada. Jalankan "restore" dulu agar nilai asli tidak tertimpa.');
        process.exit(1);
      }
      const big = intEnv('LOAD_STOCK_ML', 1000000);
      const products = await Product.findAll({ attributes: ['product_id', 'stock_ml', 'stock_ml_initial', 'sold_count'] });
      fs.writeFileSync(BACKUP, JSON.stringify(products.map(p => ({
        product_id: p.product_id, stock_ml: p.stock_ml, stock_ml_initial: p.stock_ml_initial, sold_count: p.sold_count
      }))));
      await Product.update({ stock_ml: big, stock_ml_initial: big }, { where: {} });
      console.log(`Boost: ${products.length} produk -> stock_ml=${big}. Backup: ${BACKUP}`);
    } else if (mode === 'restore') {
      if (!fs.existsSync(BACKUP)) {
        console.error('Dibatalkan: tidak ada backup (.stock_backup.json).');
        process.exit(1);
      }
      const rows = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
      await sequelize.transaction(async (t) => {
        for (const r of rows) {
          await Product.update(
            { stock_ml: r.stock_ml, stock_ml_initial: r.stock_ml_initial, sold_count: r.sold_count },
            { where: { product_id: r.product_id }, transaction: t }
          );
        }
      });
      fs.unlinkSync(BACKUP);
      console.log(`Restore: ${rows.length} produk dikembalikan ke nilai awal.`);
    } else {
      console.error('Pemakaian: node scripts/boost_stock.js boost|restore');
      process.exitCode = 1;
    }
  } catch (e) {
    console.error('Gagal:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
