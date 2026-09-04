const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Order = require('../orders/order.model');

const OrderTracking = sequelize.define('OrderTracking', {
  tracking_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Order, key: 'order_id' } },
  courier: { type: DataTypes.STRING(50) },
  tracking_number: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.TEXT },
  location: { type: DataTypes.STRING(200) }
}, { tableName: 'order_tracking', timestamps: true });

OrderTracking.belongsTo(Order, { foreignKey: 'order_id' });
Order.hasOne(OrderTracking, { foreignKey: 'order_id', as: 'tracking' });

module.exports = OrderTracking;