import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import AddMenuItemModal from '../../../components/AddMenuItemForm'

export default function MenuItemsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [allCategories, setAllCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchMenus()
      fetchMenuItems()
    }
  }, [status])

  useEffect(() => {
    if (menus.length > 0) {
      const categories = menus.flatMap((menu) => menu.categories || [])
      setAllCategories(categories)
      if (categories.length > 0 && !activeCategory) {
        setActiveCategory(categories[0]._id)
      }
    }
  }, [menus])

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      setMenus(data)
    } catch (error) {
      setError('Eroare la încărcarea meniurilor')
    }
  }

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu-items')
      const data = await res.json()
      setMenuItems(data)
    } catch (error) {
      setError('Eroare la încărcarea produselor')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMenuItem = async (id) => {
    if (!confirm('Sigur doriți să ștergeți acest produs din meniu?')) {
      return
    }
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/menu-items/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMenuItems(menuItems.filter((item) => item._id !== id))
      } else {
        const data = await res.json()
        setError(data.message || 'Eroare la ștergerea produsului')
      }
    } catch (error) {
      setError('Eroare la ștergerea produsului')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter menu items based on active category and search term
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      !activeCategory || item.categoryId === activeCategory
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Se încarcă...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 w-[80%]">
      <h1 className="text-2xl font-bold text-white">
        Gestionare Produse Meniu
      </h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="w-full flex justify-end">
        {/* The modal now handles the form and state */}
        <AddMenuItemModal
          menus={menus}
          onItemAdded={(newItem) => setMenuItems([...menuItems, newItem])}
        />
      </div>

      <div className="bg-black/80 shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-medium text-white/70">Produse Meniu</h2>
          <div className="mt-2 md:mt-0 relative">
            <input
              type="text"
              placeholder="Caută produse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1  w-full md:w-auto"
            />
          </div>
        </div>
        {allCategories.length > 0 && (
          <div className="overflow-x-auto whitespace-nowrap py-2 mb-4 border-b border-gray-200 cursor-pointer">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 mx-1 text-sm font-medium rounded-full ${
                !activeCategory
                  ? 'border border-[#31E981] text-white'
                  : 'border border-white/50 text-white '
              }`}
            >
              Toate Produsele
            </button>
            {allCategories.map((category) => (
              <button
                key={category._id}
                onClick={() => setActiveCategory(category._id)}
                className={`px-4 py-2 mx-1 text-sm font-medium rounded-full cursor-pointer ${
                  activeCategory === category._id
                    ? 'border border-[#31E981] text-white'
                    : 'border border-white/50 text-white '
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nu s-au găsit produse.{' '}
            {searchTerm ? 'Încercați alt termen de căutare sau ' : ''}
            {activeCategory ? 'selectați o altă categorie.' : ''}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMenuItems.map((item) => (
              <div
                key={item._id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap md:flex-nowrap">
                  <div className="w-full md:w-40 h-40 flex-shrink-0 overflow-hidden bg-gray-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = '/placeholder-food.jpg'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-400">
                        <span>Fără imagine</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-white/70">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          {allCategories.find(
                            (cat) => cat._id === item.categoryId
                          )?.name || 'Fără categorie'}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-white/60 font-semibold text-xl">
                          {item.price.toFixed(2)} RON
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button
                            className="p-1.5  rounded-full  text-white transition-colors cursor-pointer"
                            title="Editează produsul"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item._id)}
                            className="p-1.5  text-red-600/80 transition-colors cursor-pointer"
                            title="Șterge produsul"
                            disabled={isDeleting}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
