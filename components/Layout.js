import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const router = useRouter()
  const isAuthPage = router.pathname.startsWith('/auth/')
  const isMenuPage = router.pathname.startsWith('/menu/')
  const shouldHideSidebar = isAuthPage || isMenuPage

  return (
    <div className="relative ">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-screen object-cover -z-10 overflow-hidden"
      >
        <source src="/images/bg-video.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/90 -z-7" />

      {/* Sidebar - Hidden on auth pages and menu pages */}
      {!shouldHideSidebar && <Sidebar />}

      {/* Main Content */}
      <main className={`relative z-10 ${!shouldHideSidebar ? 'ml-64' : ''}`}>
        <div className="h-full flex items-center justify-center py-6  w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
