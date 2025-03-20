import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useSidebarContext } from './SidebarContext'

export default function Layout({ children }) {
  const router = useRouter()
  const isAuthPage = router.pathname.startsWith('/auth/')
  const isMenuPage = router.pathname.startsWith('/menu/')
  const shouldHideSidebar = isAuthPage || isMenuPage
  const { isCollapsed } = useSidebarContext()

  return (
    <div className="relative">
      <Head>
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </Head>

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
      <main
        className={`relative z-10 transition-all duration-300 ${
          !shouldHideSidebar
            ? router.pathname.includes('/dashboard')
              ? isCollapsed
                ? 'ml-[70px]'
                : 'ml-[256px]'
              : ''
            : ''
        }`}
      >
        <div className="h-full flex items-center justify-center py-6 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
