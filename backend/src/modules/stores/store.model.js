const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Cabang toko tempat customer bisa ambil pesanan (pickup)
const Store = sequelize.define('Store', {
  store_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  city: { type: DataTypes.STRING(100), allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  maps_url: { type: DataTypes.STRING(500), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'stores', timestamps: true });

module.exports = Store;