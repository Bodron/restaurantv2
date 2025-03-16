import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function ManageMenusPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [newMenu, setNewMenu] = useState({ name: '', isActive: false })
  const [newCategory, setNewCategory] = useState({ name: '', menuId: '' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchMenus()
    }
  }, [status])

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      setMenus(data)
      setLoading(false)
    } catch (error) {
      setError('Error fetching menus')
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
      if (res.ok) {
        setMenus([...menus, data])
        setNewMenu({ name: '', isActive: false })
        setError('')
      } else {
        setError(data.message)
      }
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
        body: JSON.stringify({ name: newCategory.name }),
      })
      const data = await res.json()
      if (res.ok) {
        // Update the menus state to include the new category
        const updatedMenus = menus.map((menu) =>
          menu._id === selectedMenu._id
            ? {
                ...menu,
                categories: [...(menu.categories || []), data],
              }
            : menu
        )
        setMenus(updatedMenus)
        setNewCategory({ name: '', menuId: '' })
        setError('')
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error creating category')
    }
  }

  const handleSetActiveMenu = async (menuId) => {
    try {
      const res = await fetch(`/api/menu/${menuId}/set-active`, {
        method: 'PUT',
      })
      if (res.ok) {
        // Refresh menus to get updated active status
        fetchMenus()
      } else {
        const data = await res.json()
        setError(data.message)
      }
    } catch (error) {
      setError('Error setting active menu')
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
        <h2 className="text-lg font-medium mb-4">Create New Menu</h2>
        <form onSubmit={handleCreateMenu} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Menu Name
              <input
                type="text"
                value={newMenu.name}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={newMenu.isActive}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, isActive: e.target.checked })
                }
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <span className="ml-2">Set as active menu</span>
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Menu
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Add Category to Menu</h2>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Menu
              <select
                value={selectedMenu?._id || ''}
                onChange={(e) => {
                  const menu = menus.find((m) => m._id === e.target.value)
                  setSelectedMenu(menu)
                  setNewCategory({ ...newCategory, menuId: e.target.value })
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
              Category Name
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
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
            Add Category
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Existing Menus</h2>
        <div className="space-y-4">
          {menus.map((menu) => (
            <div key={menu._id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{menu.name}</h3>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      menu.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {menu.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {!menu.isActive && (
                    <button
                      onClick={() => handleSetActiveMenu(menu._id)}
                      className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Set Active
                    </button>
                  )}
                </div>
              </div>
              <div className="pl-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Categories:
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {menu.categories?.map((category) => (
                    <li key={category._id} className="text-sm text-gray-600">
                      {category.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
