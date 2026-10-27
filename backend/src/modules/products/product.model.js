const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Product = sequelize.define('Product', {
  product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  brand: { type: DataTypes.STRING(100), allowNull: false },
  product_name: { type: DataTypes.STRING(200), allowNull: false },
  concentration: { type: DataTypes.STRING(50) },
  inspirator: { type: DataTypes.STRING(200) },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Unisex'), defaultValue: 'Unisex' },
  top_notes: { type: DataTypes.TEXT },
  middle_notes: { type: DataTypes.TEXT },
  base_notes: { type: DataTypes.TEXT },
  main_accords: { type: DataTypes.TEXT },
  longevity_hours: { type: DataTypes.INTEGER },
  longevity_display: { type: DataTypes.STRING(50) },
  pros: { type: DataTypes.TEXT },
  cons: { type: DataTypes.TEXT },
  characteristic: { type: DataTypes.TEXT },
  description: { type: DataTypes.TEXT },
  cost_price_per_ml: { type: DataTypes.INTEGER },
  price_1ml: { type: DataTypes.INTEGER },
  price_2ml: { type: DataTypes.INTEGER },
  price_3ml: { type: DataTypes.INTEGER },
  price_5ml: { type: DataTypes.INTEGER },
  // Stok per ukuran botol (pcs)
  stock_1ml: { type: DataTypes.INTEGER, defaultValue: 0 },
  stock_2ml: { type: DataTypes.INTEGER, defaultValue: 0 },
  stock_3ml: { type: DataTypes.INTEGER, defaultValue: 0 },
  stock_5ml: { type: DataTypes.INTEGER, defaultValue: 0 },
  sold_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  weight_g: { type: DataTypes.STRING(20) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  image_filename: { type: DataTypes.STRING(255), defaultValue: 'default.png' }
}, {
  tableName: 'products',
  timestamps: true
});

module.exports = Product;