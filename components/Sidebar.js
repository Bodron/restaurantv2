import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import { useSidebarContext } from './SidebarContext'
import {
  ChevronDownIcon,
  Bars3Icon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  ShoppingBagIcon,
  TableCellsIcon,
  FireIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
  QrCodeIcon,
  CalendarDaysIcon,
  ClockIcon,
  CubeIcon,
  Square3Stack3DIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  DocumentChartBarIcon,
  ListBulletIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

const MenuItem = ({ item, isNested = false, isCollapsed = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const isActive = router.pathname === item.href

  if (item.children) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`${isNested ? 'ml-4' : ''} relative group`}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } p-2 text-gray-300 hover:text-white rounded-md ${
            isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800/50'
          }`}
        >
          <span className="flex items-center">
            {item.icon && (
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: isOpen ? 360 : 0 }}
                transition={{ duration: 0.3 }}
                className="relative group-hover:text-white"
              >
                <item.icon
                  className={`${
                    isCollapsed ? 'mr-0' : 'mr-3'
                  } h-6 w-6 text-gray-400 group-hover:text-white`}
                  aria-hidden="true"
                />
                {isCollapsed && (
                  <span className="fixed left-[68px] ml-2 w-max opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity duration-300 z-50">
                    {item.name}
                  </span>
                )}
              </motion.div>
            )}
            {!isCollapsed && (
              <span className="text-sm font-medium">{item.name}</span>
            )}
          </span>
          {!isCollapsed && (
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDownIcon className="h-4 w-4" />
            </motion.div>
          )}
        </motion.button>
        <AnimatePresence>
          {isOpen && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-1 overflow-hidden"
            >
              {item.children.map((child) => (
                <MenuItem
                  key={child.name}
                  item={child}
                  isNested={true}
                  isCollapsed={isCollapsed}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group"
    >
      <Link
        href={item.href}
        className={`${
          isNested ? 'ml-4' : ''
        } flex items-center p-2 text-gray-300 hover:text-white rounded-md ${
          isActive ? 'bg-[#31E981]/20 text-white' : 'hover:bg-gray-800/50'
        }`}
      >
        {item.icon && (
          <motion.div
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
            className="relative group-hover:text-white"
          >
            <item.icon
              className={`${
                isCollapsed ? 'mr-0' : 'mr-3'
              } h-5 w-5 text-gray-400 group-hover:text-white ${
                isActive ? 'text-white' : ''
              }`}
              aria-hidden="true"
            />
            {isCollapsed && (
              <span className="fixed left-[68px] ml-2 w-max opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity duration-300 z-50">
                {item.name}
              </span>
            )}
          </motion.div>
        )}
        {!isCollapsed && (
          <span className="text-sm font-medium">{item.name}</span>
        )}
      </Link>
    </motion.div>
  )
}

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebarContext()
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' })
  }

  const navigation = [
    {
      name: 'Restaurant',
      href: '/dashboard/restaurant',
      icon: BuildingStorefrontIcon,
      children: [
        {
          name: 'Tables',
          href: '/dashboard/restaurant/tables',
          icon: TableCellsIcon,
        },
        {
          name: 'Menu Items',
          href: '/dashboard/restaurant/menuitems',
          icon: ListBulletIcon,
        },
        {
          name: 'Manage Menus',
          href: '/dashboard/restaurant/managemenus',
          icon: ClipboardDocumentListIcon,
        },
      ],
    },
    {
      name: 'Orders',
      href: '/dashboard/orders-management',
      icon: ShoppingBagIcon,
      children: [
        {
          name: 'Live Orders',
          href: '/dashboard/orders-management',
          icon: ClipboardDocumentCheckIcon,
        },
        {
          name: 'All Tables Orders',
          href: '/dashboard/orders/tables-history',
          icon: TableCellsIcon,
        },
        {
          name: 'Order History',
          href: '/dashboard/orders/history',
          icon: ClockIcon,
        },
        {
          name: 'Statistics',
          href: '/dashboard/orders/statistics',
          icon: DocumentChartBarIcon,
        },
      ],
    },
    {
      name: 'Kitchen',
      href: '/dashboard/kitchen',
      icon: FireIcon,
      children: [
        {
          name: 'Queue',
          href: '/dashboard/kitchen/queue',
          icon: ListBulletIcon,
        },
        {
          name: 'Preparation Times',
          href: '/dashboard/kitchen/prep-times',
          icon: ClockIcon,
        },
        {
          name: 'Inventory',
          href: '/dashboard/kitchen/inventory',
          icon: CubeIcon,
        },
      ],
    },
  ]

  return (
    <motion.div
      initial={{ width: 256 }}
      animate={{
        width: isCollapsed ? 100 : 256,
      }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="bg-black/90 h-screen fixed left-0 top-0 overflow-hidden z-50 flex flex-col shadow-xl"
    >
      {/* Header with logo and toggle button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center justify-center bg-black/50 px-2 py-4 relative"
      >
        <AnimatePresence>
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white font-bold"
            >
              <img
                src="/images/logorestaurant.jpg"
                alt="Restaurant Logo"
                className="h-36 w-auto object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white font-bold"
            >
              <img
                src="/images/logorestaurant.jpg"
                alt="Restaurant Logo"
                className="h-28 w-auto object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute right-2 top-2 p-1.5 rounded-full hover:bg-gray-700/50 bg-black/20"
        >
          <Bars3Icon className="h-5 w-5 text-white" />
        </button>
      </motion.div>

      {/* Main navigation menu */}
      <div className="px-2 py-4 space-y-1.5 flex-grow overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navigation.map((item) => (
          <MenuItem key={item.name} item={item} isCollapsed={isCollapsed} />
        ))}
      </div>

      {/* User profile and sign out section - positioned at bottom */}
      <div className="mt-auto border-t border-gray-800/50 overflow-hidden">
        {session?.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`w-full px-4 py-3 flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <div className={`flex items-center ${!isCollapsed && 'space-x-3'}`}>
              <div className="flex items-center justify-center bg-gray-800 rounded-full w-9 h-9">
                <UserCircleIcon className="h-6 w-6 text-gray-300" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm">
                    {session.user.name || 'User'}
                  </span>
                  <span className="text-gray-400 text-xs truncate max-w-[160px]">
                    {session.user.email}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Sign Out Button */}
        <div className={`px-2 py-2 mb-2 ${isCollapsed ? 'mt-1' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className={`w-full flex items-center p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors duration-200 ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <ArrowRightOnRectangleIcon
              className={`h-5 w-5 ${!isCollapsed && 'mr-3'}`}
            />
            {!isCollapsed && <span className="text-sm">Sign Out</span>}
            {isCollapsed && (
              <span className="fixed left-[68px] ml-2 w-max opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity duration-300 z-50">
                Sign Out
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// Custom CSS for hiding scrollbars
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`
