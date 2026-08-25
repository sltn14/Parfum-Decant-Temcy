const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../auth/user.model');

const Order = sequelize.define('Order', {
  order_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'user_id' } },
  order_code: { type: DataTypes.STRING(50), unique: true },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  total_price: { type: DataTypes.INTEGER, allowNull: false },
  shipping_name: { type: DataTypes.STRING(100) },
  shipping_phone: { type: DataTypes.STRING(20) },
  shipping_address: { type: DataTypes.TEXT },
  shipping_city: { type: DataTypes.STRING(100) },
  shipping_notes: { type: DataTypes.TEXT },
  payment_method: { type: DataTypes.STRING(50), defaultValue: 'QRIS' },
  payment_proof: { type: DataTypes.STRING(255) },
  paid_at: { type: DataTypes.DATE }
}, { tableName: 'orders', timestamps: true });

Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

module.exports = Order;