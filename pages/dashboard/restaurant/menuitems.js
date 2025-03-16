import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function MenuItemsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    menuId: '',
    categoryId: '',
  })

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

  const handleCreateMenuItem = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMenuItem),
      })
      const data = await res.json()
      if (res.ok) {
        setMenuItems([...menuItems, data])
        setNewMenuItem({
          name: '',
          description: '',
          price: '',
          menuId: '',
          categoryId: '',
        })
        setError('')
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error creating menu item')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 text-black">Add Menu Item</h2>
        <form onSubmit={handleCreateMenuItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Menu
              <select
                value={newMenuItem.menuId}
                onChange={(e) => {
                  setNewMenuItem({
                    ...newMenuItem,
                    menuId: e.target.value,
                    categoryId: '', // Reset category when menu changes
                  })
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a menu</option>
                {menus.map((menu) => (
                  <option key={menu._id} value={menu._id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
              <select
                value={newMenuItem.categoryId}
                onChange={(e) =>
                  setNewMenuItem({
                    ...newMenuItem,
                    categoryId: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
                disabled={!newMenuItem.menuId}
              >
                <option value="">Select a category</option>
                {menus
                  .find((menu) => menu._id === newMenuItem.menuId)
                  ?.categories?.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
              <input
                type="text"
                value={newMenuItem.name}
                onChange={(e) =>
                  setNewMenuItem({ ...newMenuItem, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
              <textarea
                value={newMenuItem.description}
                onChange={(e) =>
                  setNewMenuItem({
                    ...newMenuItem,
                    description: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price
              <input
                type="number"
                step="0.01"
                value={newMenuItem.price}
                onChange={(e) =>
                  setNewMenuItem({
                    ...newMenuItem,
                    price: parseFloat(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Menu Item
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 text-black">Menu Items</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <div key={item._id} className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-black">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
              <p className="text-lg font-semibold text-indigo-600 mt-2">
                ${item.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
