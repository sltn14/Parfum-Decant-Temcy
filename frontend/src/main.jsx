import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import useAuthStore from './store/authStore'

// Bersihkan flag logout yang mungkin tertinggal
sessionStorage.removeItem('logging-out')

const path = window.location.pathname
const isGoogleCallback = path.includes('/auth/google/callback')

if (!isGoogleCallback) {
  try {
    // Cek localStorage (remember me)
    const savedLocal = localStorage.getItem('auth-storage')
    if (savedLocal) {
      const parsed = JSON.parse(savedLocal)
      if (parsed?.user && parsed?.token) {
        useAuthStore.setState({
          user: parsed.user,
          token: parsed.token,
          isAuthenticated: true
        })
      } else {
        localStorage.removeItem('auth-storage')
      }
    } else {
      // Cek sessionStorage (login tanpa remember me)
      const savedSession = sessionStorage.getItem('auth-session')
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        if (parsed?.user && parsed?.token) {
          useAuthStore.setState({
            user: parsed.user,
            token: parsed.token,
            isAuthenticated: true
          })
        } else {
          sessionStorage.removeItem('auth-session')
        }
      }
    }
  } catch {
    localStorage.removeItem('auth-storage')
    sessionStorage.removeItem('auth-session')
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)