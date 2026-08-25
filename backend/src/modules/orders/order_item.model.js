const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Order = require('./order.model');
const Product = require('../products/product.model');

const OrderItem = sequelize.define('OrderItem', {
  order_item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Order, key: 'order_id' } },
  product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Product, key: 'product_id' } },
  product_name: { type: DataTypes.STRING(200) },
  brand: { type: DataTypes.STRING(100) },
  size_ml: { type: DataTypes.INTEGER },
  quantity: { type: DataTypes.INTEGER },
  price: { type: DataTypes.INTEGER }
}, { tableName: 'order_items', timestamps: false });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = OrderItem;