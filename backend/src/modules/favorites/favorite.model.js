const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../auth/user.model');
const Product = require('../products/product.model');

const Favorite = sequelize.define('Favorite', {
  favorite_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'user_id' } },
  product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Product, key: 'product_id' } }
}, { tableName: 'favorites', timestamps: true });

Favorite.belongsTo(User, { foreignKey: 'user_id' });
Favorite.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = Favorite;