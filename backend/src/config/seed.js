const XLSX = require('xlsx');
const sequelize = require('./database');
const Product = require('../modules/products/product.model');

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

    const products = rows.map(row => ({
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
      stock_ml: row['stock_ml'] ? parseFloat(row['stock_ml']) : 0,
      sold_count: row['sold_count'] ? parseInt(row['sold_count']) : 0,
      weight_g: row['weight_g'] ? String(row['weight_g']) : '50gram',
      is_active: row['is_active'] === 1,
      image_filename: row['image_filename'] || 'default.png'
    }));

    await Product.bulkCreate(products, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${products.length} products!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedProducts();