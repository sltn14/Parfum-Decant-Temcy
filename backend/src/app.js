const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
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
require('./modules/sysadmin/system_config.model');
require('./modules/sysadmin/system_log.model');

const app = express();
const httpServer = http.createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Raw body untuk webhook Midtrans
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

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
app.use('/api/sysadmin', require('./modules/sysadmin/sysadmin.routes'));
app.use('/api/notifications', require('./modules/notification/notification.routes'));
app.use('/api/chatbot', require('./modules/chatbot/chatbot.routes'));
app.use('/api/recommendations', require('./modules/recommendation/recommendation.routes'));
app.use('/api/favorites', require('./modules/favorites/favorite.routes'));
app.use('/api/addresses', require('./modules/addresses/address.routes'));
app.use('/api/shipping', require('./modules/shipping/shipping.routes'));
app.use('/api/vouchers', require('./modules/vouchers/voucher.routes'));
app.use('/api/tracking', require('./modules/tracking/tracking.routes'));
app.use('/api/stores', require('./modules/stores/store.routes'));

app.get('/', (req, res) => {
  res.json({ message: 'Decant Temcy API is running' });
});

// Helper untuk save log dari controller lain
app.set('saveLog', async (level, message, source = null, userId = null, metadata = null) => {
  try {
    const SystemLog = require('./modules/sysadmin/system_log.model');
    await SystemLog.create({ level, message, source, user_id: userId, metadata });
  } catch {}
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');

    // Sync model baru (tidak drop tabel yang ada)
    const SystemConfig = require('./modules/sysadmin/system_config.model');
    const SystemLog = require('./modules/sysadmin/system_log.model');
    await SystemConfig.sync({ alter: false });
    await SystemLog.sync({ alter: false });

    // Store pickup: buat tabel stores, tambah kolom di orders, isi store default kalau kosong
    const Store = require('./modules/stores/store.model');
    await Store.sync({ alter: false });
    await sequelize.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_store_id INTEGER');
    if ((await Store.count()) === 0) {
      await Store.create({ name: 'Decant Temcy Semarang', city: 'Semarang', address: 'Semarang' });
      console.log('Store default dibuat. Ubah alamat lengkapnya di Admin > Cabang Toko.');
    }

    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect DB:', err);
  }
};

startServer();