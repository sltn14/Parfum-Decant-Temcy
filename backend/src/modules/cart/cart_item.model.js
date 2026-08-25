const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Cart = require('./cart.model');
const Product = require('../products/product.model');

const CartItem = sequelize.define('CartItem', {
  cart_item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cart_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Cart, key: 'cart_id' } },
  product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Product, key: 'product_id' } },
  size_ml: { type: DataTypes.INTEGER, allowNull: false }, // 1, 2, 3, atau 5
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  price: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'cart_items', timestamps: true });

// Associations
Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = CartItem;