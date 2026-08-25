const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../auth/user.model');
const Product = require('../products/product.model');

const Review = sequelize.define('Review', {
  review_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'user_id' } },
  product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Product, key: 'product_id' } },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'reviews', timestamps: true });

Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });

module.exports = Review;