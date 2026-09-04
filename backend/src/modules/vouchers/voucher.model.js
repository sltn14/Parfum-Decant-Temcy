const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Voucher = sequelize.define('Voucher', {
  voucher_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  type: { type: DataTypes.ENUM('percentage', 'fixed'), defaultValue: 'percentage' },
  value: { type: DataTypes.INTEGER, allowNull: false },
  min_purchase: { type: DataTypes.INTEGER, defaultValue: 0 },
  max_discount: { type: DataTypes.INTEGER, allowNull: true },
  quota: { type: DataTypes.INTEGER, defaultValue: 1 },
  used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  expired_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'vouchers', timestamps: true });

module.exports = Voucher;