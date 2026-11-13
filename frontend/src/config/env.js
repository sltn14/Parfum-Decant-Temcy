// Satu sumber alamat backend. Atur lewat VITE_API_URL di frontend/.env
// (contoh: https://api.domain.com/api). Jangan menulis localhost langsung di komponen.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Alamat server tanpa "/api": dipakai untuk gambar upload dan Socket.io
export const API_URL = API_BASE.replace(/\/api\/?$/, '')
