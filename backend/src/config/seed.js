const XLSX = require('xlsx');
const sequelize = require('./database');
const Product = require('../modules/products/product.model');
const { mlFields } = require('../utils/stockMl');

// Pemakaian:
//   node src/config/seed.js            -> DRY RUN: hanya menampilkan produk yang akan ditambah/dilewati
//   node src/config/seed.js --apply    -> benar-benar menulis ke database (pastikan DB_NAME benar!)
// Seed idempoten: produk yang sudah ada (brand + product_name, tanpa beda huruf besar/kecil)
// dilewati, sehingga aman dijalankan lebih dari sekali.
const APPLY = process.argv.includes('--apply');
const keyOf = (brand, name) => `${String(brand || '').trim().toLowerCase()}|${String(name || '').trim().toLowerCase()}`;

const seedProducts = async () => {
  try {
    await sequelize.authenticate();

    const workbook = XLSX.readFile('./Database_Decant_Temcy.xlsx');
    const sheet = workbook.Sheets['Dataset'];

    // Baca semua sebagai array of arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Cari baris yang ada 'product_id' atau 'brand' sebagai header
    const headerRowIndex = rawData.findIndex(row =>
      row.includes('product_id') || row.includes('brand')
    );

    console.log('Header ditemukan di baris:', headerRowIndex);
    console.log('Isi header:', rawData[headerRowIndex]);

    const headers = rawData[headerRowIndex];
    const dataRows = rawData.slice(headerRowIndex + 1);

    const rows = dataRows.map(row => {
      const obj = {};
      headers.forEach((key, i) => {
        if (key) obj[key] = row[i];
      });
      return obj;
    }).filter(row => row['brand'] && row['brand'] !== '');

    console.log('Total rows valid:', rows.length);
    console.log('Row pertama:', rows[0]);

    const toInt = (v) => (v ? parseInt(v) : 0);
    const products = rows.map(row => {
      // Stok = sisa ml botol besar (kolom stock_ml di Excel). Kalau kosong, pakai total dari
      // kolom vial lama (1/2/3/5 ml) supaya data lama tetap terbaca. Kolom vial tetap disimpan (data lama).
      const vials = {
        stock_1ml: toInt(row['stock_1ml']), stock_2ml: toInt(row['stock_2ml']),
        stock_3ml: toInt(row['stock_3ml']), stock_5ml: toInt(row['stock_5ml'])
      };
      const vialTotalMl = vials.stock_1ml + 2 * vials.stock_2ml + 3 * vials.stock_3ml + 5 * vials.stock_5ml;
      const excelStockMl = row['stock_ml'] ? parseFloat(row['stock_ml']) : vialTotalMl;
      return {
        brand: row['brand'] || '',
        product_name: row['product_name'] || '',
        concentration: row['concentration'] || null,
        inspirator: row['inspirator'] || null,
        gender: ['Male', 'Female', 'Unisex'].includes(row['gender']) ? row['gender'] : 'Unisex',
        top_notes: row['top_notes'] || null,
        middle_notes: row['middle_notes'] || null,
        base_notes: row['base_notes'] || null,
        main_accords: row['main_accords'] || null,
        longevity_hours: row['longevity_hours'] ? parseInt(row['longevity_hours']) : null,
        longevity_display: row['longevity_display'] || null,
        pros: row['pros'] || null,
        cons: row['cons'] || null,
        characteristic: row['characteristic'] || null,
        description: row['description'] || null,
        cost_price_per_ml: row['cost_price_per_ml'] ? parseInt(row['cost_price_per_ml']) : 0,
        price_1ml: row['price_1ml'] ? parseInt(row['price_1ml']) : 0,
        price_2ml: row['price_2ml'] ? parseInt(row['price_2ml']) : 0,
        price_3ml: row['price_3ml'] ? parseInt(row['price_3ml']) : 0,
        price_5ml: row['price_5ml'] ? parseInt(row['price_5ml']) : 0,
        price_10ml: row['price_10ml'] ? parseInt(row['price_10ml']) : 0,
        ...vials,
        ...mlFields(excelStockMl, excelStockMl),
        sold_count: row['sold_count'] ? parseInt(row['sold_count']) : 0,
        weight_g: row['weight_g'] ? String(row['weight_g']) : '50gram',
        is_active: row['is_active'] === 1,
        image_filename: row['image_filename'] || 'default.png'
      };
    });

    // Lewati produk yang sudah ada di database (dan duplikat di dalam Excel itu sendiri)
    const existing = await Product.findAll({ attributes: ['brand', 'product_name'], raw: true });
    const seen = new Set(existing.map(p => keyOf(p.brand, p.product_name)));
    const toCreate = [];
    const skipped = [];
    for (const p of products) {
      const k = keyOf(p.brand, p.product_name);
      if (seen.has(k)) { skipped.push(`${p.brand} - ${p.product_name}`); continue; }
      seen.add(k);
      toCreate.push(p);
    }

    console.log(`\nDiff: ${toCreate.length} produk BARU, ${skipped.length} dilewati (sudah ada).`);
    toCreate.forEach(p => console.log(`  + ${p.brand} - ${p.product_name} (stock_ml=${p.stock_ml}, initial=${p.stock_ml_initial})`));
    skipped.forEach(n => console.log(`  = ${n}`));

    if (!APPLY) {
      console.log('\nDRY RUN: tidak ada yang ditulis. Jalankan dengan --apply untuk menyimpan.');
    } else {
      await Product.bulkCreate(toCreate);
      console.log(`✅ Seeded ${toCreate.length} products!`);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedProducts();