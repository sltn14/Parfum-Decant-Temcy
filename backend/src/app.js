const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const session = require('express-session');
const passport = require('./config/passport');
const sequelize = require('./config/database');

// Import models
require('./modules/products/product.model');
require('./modules/auth/user.model');
require('./modules/cart/cart.model');
require('./modules/cart/cart_item.model');
require('./modules/orders/order.model');
require('./modules/orders/order_item.model');
require('./modules/reviews/review.model');
require('./modules/notification/notification.model');
require('./modules/favorites/favorite.model');
require('./modules/addresses/address.model');
require('./modules/vouchers/voucher.model');
require('./modules/tracking/tracking.model');

const app = express();

// Raw body parser untuk webhook Midtrans (HARUS sebelum express.json)
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session untuk Passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/products', require('./modules/products/product.routes'));
app.use('/api/cart', require('./modules/cart/cart.routes'));
app.use('/api/orders', require('./modules/orders/order.routes'));
app.use('/api/reviews', require('./modules/reviews/review.routes'));
app.use('/api/users', require('./modules/users/user.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/notifications', require('./modules/notification/notification.routes'));
app.use('/api/chatbot', require('./modules/chatbot/chatbot.routes'));
app.use('/api/recommendations', require('./modules/recommendation/recommendation.routes'));
app.use('/api/favorites', require('./modules/favorites/favorite.routes'));
app.use('/api/addresses', require('./modules/addresses/address.routes'));
app.use('/api/shipping', require('./modules/shipping/shipping.routes'));
app.use('/api/vouchers', require('./modules/vouchers/voucher.routes'));
app.use('/api/tracking', require('./modules/tracking/tracking.routes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Decant Temcy API is running' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
    // await sequelize.sync({ alter: true });
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect DB:', err);
  }
};

startServer();