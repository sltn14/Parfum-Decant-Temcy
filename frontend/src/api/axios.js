import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  let token = useAuthStore.getState().token

  if (!token) {
    try {
      const local = localStorage.getItem('auth-storage')
      if (local) token = JSON.parse(local)?.token
    } catch {}
  }

  if (!token) {
    try {
      const session = sessionStorage.getItem('auth-session')
      if (session) token = JSON.parse(session)?.token
    } catch {}
  }

  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { isAuthenticated } = useAuthStore.getState()
      const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/google']
      const onAuthPage = authPages.some(p => window.location.pathname.startsWith(p))
      const loggingOut = sessionStorage.getItem('logging-out') === 'true'
      const isSysadminReauth = error.config?.url?.includes('/sysadmin/')

      if (isAuthenticated && !onAuthPage && !loggingOut && !isSysadminReauth) {
        localStorage.removeItem('auth-storage')
        sessionStorage.removeItem('auth-session')
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api