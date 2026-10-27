import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

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
import AdminSalesReport from './pages/admin/AdminSalesReport'
import AdminReviews from './pages/admin/AdminReviews'
import AdminVouchers from './pages/admin/AdminVouchers'
import AdminInventory from './pages/admin/AdminInventory'
import AdminAIInsight from './pages/admin/AdminAIInsight'

// SysAdmin Pages
import SysAdminDashboard from './pages/sysadmin/SysAdminDashboard'
import SysAdminUsers from './pages/sysadmin/SysAdminUsers'
import SysAdminConfig from './pages/sysadmin/SysAdminConfig'
import SysAdminMonitoring from './pages/sysadmin/SysAdminMonitoring'

// Layouts
import CustomerLayout from './components/layout/CustomerLayout'
import AdminLayout from './components/layout/AdminLayout'
import SysAdminLayout from './components/layout/SysAdminLayout'

// Not Found
import NotFoundPage from './pages/NotFoundPage'

// Route Guards
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

const SysAdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (user?.role !== 'sysadmin') return <Navigate to="/" />
  return children
}

const CustomerOnlyRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  if (isAuthenticated && user?.role === 'admin') return <Navigate to="/admin" replace />
  if (isAuthenticated && user?.role === 'sysadmin') return <Navigate to="/sysadmin" replace />
  return children
}

function App() {
  return (
    <>
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        duration: 3000,
        style: { fontSize: '0.85rem', fontWeight: 600 }
      }}
    />
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      {/* Customer */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<CustomerOnlyRoute><HomePage /></CustomerOnlyRoute>} />
        <Route path="catalog" element={<CustomerOnlyRoute><CatalogPage /></CustomerOnlyRoute>} />
        <Route path="product/:id" element={<CustomerOnlyRoute><ProductDetailPage /></CustomerOnlyRoute>} />
        <Route path="chatbot" element={<CustomerOnlyRoute><ChatbotPage /></CustomerOnlyRoute>} />
        <Route path="cart" element={<ProtectedRoute><CustomerOnlyRoute><CartPage /></CustomerOnlyRoute></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute><CustomerOnlyRoute><CheckoutPage /></CustomerOnlyRoute></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><CustomerOnlyRoute><OrdersPage /></CustomerOnlyRoute></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><CustomerOnlyRoute><OrderDetailPage /></CustomerOnlyRoute></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><CustomerOnlyRoute><ProfilePage /></CustomerOnlyRoute></ProtectedRoute>} />
        <Route path="success" element={<ProtectedRoute><CustomerOnlyRoute><SuccessPage /></CustomerOnlyRoute></ProtectedRoute>} />
        <Route path="favorites" element={<ProtectedRoute><CustomerOnlyRoute><FavoritePage /></CustomerOnlyRoute></ProtectedRoute>} />
        <Route path="addresses" element={<ProtectedRoute><CustomerOnlyRoute><AddressPage /></CustomerOnlyRoute></ProtectedRoute>} />
      </Route>

      {/* Admin Toko */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="vouchers" element={<AdminVouchers />} />
        <Route path="sales-report" element={<AdminSalesReport />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="ai-insight" element={<AdminAIInsight />} />
      </Route>

      {/* Administrator Sistem */}
      <Route path="/sysadmin" element={<SysAdminRoute><SysAdminLayout /></SysAdminRoute>}>
        <Route index element={<SysAdminDashboard />} />
        <Route path="users" element={<SysAdminUsers />} />
        <Route path="config" element={<SysAdminConfig />} />
        <Route path="monitoring" element={<SysAdminMonitoring />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  )
}

export default App