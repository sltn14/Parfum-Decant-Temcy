import { Outlet } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Footer from '../common/Footer'
import AnimatedBackground from '../common/AnimatedBackground'

const CustomerLayout = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AnimatedBackground />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default CustomerLayout