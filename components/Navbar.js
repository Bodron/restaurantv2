import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    return null
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      current: router.pathname === '/dashboard',
    },
    {
      name: 'Menu Preview',
      href: '/menu-preview',
      current: router.pathname === '/menu-preview',
    },
    {
      name: 'Orders',
      href: '/dashboard/orders-management',
      current: router.pathname === '/dashboard/orders-management',
    },
    {
      name: 'Tables',
      href: '/dashboard/tables',
      current: router.pathname === '/dashboard/tables',
    },
  ]

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                Restaurant App
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 text-sm mr-4">
              {session.user.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
