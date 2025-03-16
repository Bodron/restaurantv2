import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { QRCodeSVG as QRCode } from 'qrcode.react'

export default function RestaurantDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tables, setTables] = useState([])
  const [menus, setMenus] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [activeTab, setActiveTab] = useState('restaurant')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form states
  const [restaurant, setRestaurant] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    openingHours: '',
  })
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 4 })
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    menuId: '',
    categoryId: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      console.log('Session:', session)
      fetchRestaurant()
      fetchTables()
      fetchMenus()
      fetchMenuItems()
    }
  }, [status])

  const fetchRestaurant = async () => {
    try {
      const res = await fetch('/api/restaurants/create')
      const data = await res.json()
      console.log('Restaurant data:', data)
      if (data) {
        setRestaurant(data)
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      setError('Error fetching restaurant')
    }
  }

  const fetchTables = async () => {
    try {
      console.log('Fetching tables...')
      const res = await fetch('/api/tables')
      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Tables data:', data)

      if (!res.ok) {
        setError(data.message || 'Failed to fetch tables')
        setTables([])
        return
      }

      setTables(Array.isArray(data) ? data : [])
      setError('')
    } catch (error) {
      console.error('Error fetching tables:', error)
      setError('Error fetching tables')
      setTables([])
    }
  }

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

  const handleCreateRestaurant = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/restaurants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      })
      const data = await res.json()
      if (res.ok) {
        setRestaurant(data)
        setError('')
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error creating restaurant')
    }
  }

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/restaurants/create', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurant),
      })
      const data = await res.json()
      if (res.ok) {
        setRestaurant(data)
        setError('')
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error updating restaurant')
    }
  }

  const handleCreateTable = async (e) => {
    e.preventDefault()
    try {
      if (!session?.user?.restaurantId) {
        setError('Please create a restaurant first')
        return
      }

      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTable),
      })
      const data = await res.json()
      if (res.ok) {
        setTables([...tables, data])
        setNewTable({ tableNumber: '', capacity: 4 })
        setError('')
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error creating table')
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
          category: '',
          menuId: '',
          categoryId: '',
        })
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

  console.log(tables)

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`${
              activeTab === 'restaurant'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
          >
            Restaurant
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`${
              activeTab === 'tables'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
          >
            Tables
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`${
              activeTab === 'menu'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
          >
            Menu Items
          </button>
          <button
            onClick={() => router.push('/dashboard/menus')}
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Manage Menus
          </button>
        </nav>
      </div>

      {/* Restaurant Section */}
      {activeTab === 'restaurant' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">
              {restaurant._id ? 'Update Restaurant' : 'Create Restaurant'}
            </h2>
            <form
              onSubmit={
                restaurant._id ? handleUpdateRestaurant : handleCreateRestaurant
              }
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                  <input
                    type="text"
                    value={restaurant.name}
                    onChange={(e) =>
                      setRestaurant({ ...restaurant, name: e.target.value })
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
                    value={restaurant.description}
                    onChange={(e) =>
                      setRestaurant({
                        ...restaurant,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                  <input
                    type="text"
                    value={restaurant.address}
                    onChange={(e) =>
                      setRestaurant({ ...restaurant, address: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                  <input
                    type="tel"
                    value={restaurant.phone}
                    onChange={(e) =>
                      setRestaurant({ ...restaurant, phone: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                  <input
                    type="email"
                    value={restaurant.email}
                    onChange={(e) =>
                      setRestaurant({ ...restaurant, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opening Hours
                  <textarea
                    value={restaurant.openingHours}
                    onChange={(e) =>
                      setRestaurant({
                        ...restaurant,
                        openingHours: e.target.value,
                      })
                    }
                    placeholder="e.g. Mon-Fri: 9:00-22:00&#10;Sat-Sun: 10:00-23:00"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {restaurant._id ? 'Update Restaurant' : 'Create Restaurant'}
              </button>
            </form>
          </div>

          {restaurant._id && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Restaurant Details</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant.address}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant.description}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Opening Hours
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {restaurant.openingHours}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Tables Section */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Add New Table</h2>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Table Number
                  <input
                    type="number"
                    value={newTable.tableNumber}
                    onChange={(e) =>
                      setNewTable({
                        ...newTable,
                        tableNumber: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Capacity
                  <input
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) =>
                      setNewTable({ ...newTable, capacity: e.target.value })
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
                Add Table
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Tables</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tables?.map((table) => (
                <div key={table._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        Table {table.tableNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Capacity: {table.capacity}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: {table.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center mb-4">
                    <QRCode
                      value={`${
                        typeof window !== 'undefined'
                          ? window.location.origin
                          : ''
                      }/menu/${table.qrCode}`}
                      size={200}
                      level="H"
                    />
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="w-full py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Print QR Code
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Section */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Add Menu Item</h2>
            <form onSubmit={handleCreateMenuItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Menu
                  <select
                    value={newMenuItem.menuId}
                    onChange={(e) => {
                      const selectedMenu = menus.find(
                        (m) => m._id === e.target.value
                      )
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
            <h2 className="text-lg font-medium mb-4">Menu Items</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems.map((item) => (
                <div key={item._id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                  <p className="text-lg font-semibold text-indigo-600 mt-2">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
