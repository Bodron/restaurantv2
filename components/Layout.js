import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const router = useRouter()
  const isAuthPage = router.pathname.startsWith('/auth/')

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

      {/* Sidebar - Hidden on auth pages */}
      {!isAuthPage && <Sidebar />}

      {/* Main Content */}
      <main className={`relative z-10 ${!isAuthPage ? 'ml-64' : ''}`}>
        <div className="  flex items-center justify-center  py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
