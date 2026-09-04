const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../auth/user.model');

const Address = sequelize.define('Address', {
  address_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'user_id' } },
  label: { type: DataTypes.STRING(50), defaultValue: 'Rumah' },
  recipient_name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  province: { type: DataTypes.STRING(100), allowNull: false },
  province_id: { type: DataTypes.STRING(10) },
  city: { type: DataTypes.STRING(100), allowNull: false },
  city_id: { type: DataTypes.STRING(10) },
  district: { type: DataTypes.STRING(100) },
  postal_code: { type: DataTypes.STRING(10) },
  detail: { type: DataTypes.TEXT, allowNull: false },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'addresses', timestamps: true });

Address.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Address;