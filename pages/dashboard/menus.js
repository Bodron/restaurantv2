import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function MenusManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form states
  const [newMenu, setNewMenu] = useState({
    name: '',
    description: '',
    isActive: true,
  })

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    menuId: '',
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
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch menus')
      }
      setMenus(data)
      if (data.length > 0 && !selectedMenu) {
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
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch menu items')
      }
      setMenuItems(data)
    } catch (error) {
      setError('Error fetching menu items')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMenu = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMenu),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create menu')
      }
      setMenus([...menus, data])
      setNewMenu({ name: '', description: '', isActive: true })
      setError('')
    } catch (error) {
      setError('Error creating menu')
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!selectedMenu) {
      setError('Please select a menu first')
      return
    }
    try {
      const res = await fetch(`/api/menu/${selectedMenu._id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCategory, menuId: selectedMenu._id }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create category')
      }
      // Update the selected menu with the new category
      setSelectedMenu({
        ...selectedMenu,
        categories: [...(selectedMenu.categories || []), data],
      })
      setNewCategory({ name: '', description: '', menuId: '' })
      setError('')
      // Refresh menus to get updated data
      fetchMenus()
    } catch (error) {
      setError('Error creating category')
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left column - Menu Management */}
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Create New Menu</h2>
            <form onSubmit={handleCreateMenu} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Menu Name
                </label>
                <input
                  type="text"
                  value={newMenu.name}
                  onChange={(e) =>
                    setNewMenu({ ...newMenu, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newMenu.description}
                  onChange={(e) =>
                    setNewMenu({ ...newMenu, description: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows="3"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newMenu.isActive}
                  onChange={(e) =>
                    setNewMenu({ ...newMenu, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active Menu
                </label>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Menu
              </button>
            </form>
          </div>

          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Available Menus</h2>
            <div className="space-y-4">
              {menus.map((menu) => (
                <div
                  key={menu._id}
                  className={`p-4 rounded-lg border cursor-pointer ${
                    selectedMenu?._id === menu._id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-500'
                  }`}
                  onClick={() => setSelectedMenu(menu)}
                >
                  <h3 className="font-medium">{menu.name}</h3>
                  <p className="text-sm text-gray-500">{menu.description}</p>
                  <div className="mt-2 flex items-center">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        menu.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {menu.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Category Management */}
        <div>
          {selectedMenu ? (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">
                Add Category to {selectedMenu.name}
              </h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows="3"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Category
                </button>
              </form>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Categories</h3>
                <div className="space-y-4">
                  {selectedMenu.categories?.map((category) => (
                    <div
                      key={category._id}
                      className="p-4 rounded-lg border border-gray-200"
                    >
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                      <div className="mt-2">
                        <span className="text-sm text-gray-500">
                          {
                            menuItems.filter(
                              (item) => item.categoryId === category._id
                            ).length
                          }{' '}
                          items
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">
                Select a menu to manage categories
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
