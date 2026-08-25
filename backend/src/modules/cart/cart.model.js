const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../auth/user.model');

const Cart = sequelize.define('Cart', {
  cart_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'user_id' } }
}, { tableName: 'carts', timestamps: true });

module.exports = Cart;