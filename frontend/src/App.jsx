import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Not Found Page
import NotFoundPage from './pages/NotFoundPage'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Customer Pages
import HomePage from './pages/customer/HomePage'
import CatalogPage from './pages/customer/CatalogPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import ProfilePage from './pages/customer/ProfilePage'
import ChatbotPage from './pages/customer/ChatbotPage'
import SuccessPage from './pages/customer/SuccessPage'
import FavoritePage from './pages/customer/FavoritePage'
import AddressPage from './pages/customer/AddressPage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSalesReport from './pages/admin/AdminSalesReport'
import AdminReviews from './pages/admin/AdminReviews'
import AdminVouchers from './pages/admin/AdminVouchers'

// Layout
import CustomerLayout from './components/layout/CustomerLayout'
import AdminLayout from './components/layout/AdminLayout'

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (user?.role !== 'admin') return <Navigate to="/" />
  return children
}

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      {/* Customer */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
	<Route path="favorites" element={<ProtectedRoute><FavoritePage /></ProtectedRoute>} />
	<Route path="addresses" element={<ProtectedRoute><AddressPage /></ProtectedRoute>} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="sales-report" element={<AdminSalesReport />} />
        <Route path="reviews" element={<AdminReviews />} />
	<Route path="vouchers" element={<AdminVouchers />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
export default App