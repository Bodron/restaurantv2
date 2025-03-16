import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function MenuPreview() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [menus, setMenus] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchMenus()
      fetchMenuItems()
    }
  }, [status])

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      setMenus(data)
      if (data.length > 0) {
        setSelectedMenu(data[0])
      }
    } catch (error) {
      setError('Error fetching menus')
    }
  }

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu-items')
      const data = await res.json()
      setMenuItems(data)
    } catch (error) {
      setError('Error fetching menu items')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Menu Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Menu
        </label>
        <select
          value={selectedMenu?._id || ''}
          onChange={(e) => {
            const menu = menus.find((m) => m._id === e.target.value)
            setSelectedMenu(menu)
          }}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {menus.map((menu) => (
            <option key={menu._id} value={menu._id}>
              {menu.name}
            </option>
          ))}
        </select>
      </div>

      {/* Menu Display */}
      {selectedMenu && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-2xl font-bold leading-6 text-gray-900">
              {selectedMenu.name}
            </h3>
            {selectedMenu.description && (
              <p className="mt-1 text-sm text-gray-500">
                {selectedMenu.description}
              </p>
            )}
          </div>

          <div className="border-t border-gray-200">
            {selectedMenu.categories?.map((category) => (
              <div key={category._id} className="px-4 py-5 sm:p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  {category.name}
                </h4>
                {category.description && (
                  <p className="text-sm text-gray-500 mb-4">
                    {category.description}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {menuItems
                    .filter((item) => item.categoryId === category._id)
                    .map((item) => (
                      <div
                        key={item._id}
                        className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
                      >
                        <div className="flex justify-between">
                          <div>
                            <h5 className="text-lg font-medium text-gray-900">
                              {item.name}
                            </h5>
                            {item.description && (
                              <p className="text-sm text-gray-500">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                        {item.isSpicy && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2 mr-2">
                            Spicy
                          </span>
                        )}
                        {item.isVegetarian && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2 mr-2">
                            Vegetarian
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                            Vegan
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
