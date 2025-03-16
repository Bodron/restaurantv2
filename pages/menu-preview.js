import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function MenuPreview() {
  const { data: session } = useSession()
  const [menus, setMenus] = useState([])
  const [selectedMenu, setSelectedMenu] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      fetchMenus()
    }
  }, [session])

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      setMenus(data)
      if (data.length > 0) {
        setSelectedMenu(data[0]._id)
      }
      setLoading(false)
    } catch (error) {
      setError('Error fetching menus')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    )
  }

  const currentMenu = menus.find((menu) => menu._id === selectedMenu)

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">
          Select Menu
          <select
            value={selectedMenu}
            onChange={(e) => setSelectedMenu(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {menus.map((menu) => (
              <option key={menu._id} value={menu._id}>
                {menu.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {currentMenu && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-2xl font-bold leading-6 text-gray-900">
              {currentMenu.name}
            </h3>
            {currentMenu.description && (
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {currentMenu.description}
              </p>
            )}
          </div>

          <div className="border-t border-gray-200">
            {currentMenu.categories.map((category) => (
              <div key={category._id} className="px-4 py-5 sm:p-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  {category.name}
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((item) => (
                    <div
                      key={item._id}
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200"
                    >
                      {item.image && (
                        <div className="h-48 w-full mb-4 overflow-hidden rounded-md">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <h5 className="text-lg font-medium text-gray-900">
                        {item.name}
                      </h5>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.description}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-indigo-600">
                        ${item.price.toFixed(2)}
                      </p>
                      {item.allergens && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            Allergens: {item.allergens.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
