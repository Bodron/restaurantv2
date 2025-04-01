import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function ManageMenusPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [newMenu, setNewMenu] = useState({ name: '', isActive: false })
  const [newCategory, setNewCategory] = useState({ name: '', menuId: '' })
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedMenuForPreview, setSelectedMenuForPreview] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingMenuId, setEditingMenuId] = useState(null)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
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

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      setMenus(data)
      setLoading(false)
    } catch (error) {
      setError('Eroare la încărcarea meniurilor')
      setLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu-items')
      const data = await res.json()
      setMenuItems(data)
    } catch (error) {
      setError('Eroare la încărcarea produselor')
    }
  }

  const handleCreateMenu = async (e) => {
    e.preventDefault()
    try {
      if (isEditMode && editingMenuId) {
        // Update existing menu
        const res = await fetch(`/api/menu/${editingMenuId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMenu),
        })

        const data = await res.json()
        if (res.ok) {
          setMenus(
            menus.map((menu) =>
              menu._id === editingMenuId
                ? { ...menu, name: data.name, isActive: data.isActive }
                : menu
            )
          )
          resetMenuForm()
        } else {
          setError(data.message || 'Eroare la actualizarea meniului')
        }
      } else {
        // Create new menu
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMenu),
        })
        const data = await res.json()
        if (res.ok) {
          setMenus([...menus, data])
          resetMenuForm()
        } else {
          setError(data.message || 'Eroare la crearea meniului')
        }
      }
    } catch (error) {
      setError('Eroare la procesarea meniului')
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!selectedMenu) {
      setError('Vă rugăm să selectați mai întâi un meniu')
      return
    }

    try {
      if (isEditingCategory && editingCategoryId) {
        // Update existing category
        const res = await fetch(
          `/api/menu/${selectedMenu._id}/categories/${editingCategoryId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCategory.name }),
          }
        )

        const data = await res.json()
        if (res.ok) {
          // Update the menus state to update the category
          const updatedMenus = menus.map((menu) => {
            if (menu._id === selectedMenu._id) {
              return {
                ...menu,
                categories: menu.categories.map((cat) =>
                  cat._id === editingCategoryId
                    ? { ...cat, name: newCategory.name }
                    : cat
                ),
              }
            }
            return menu
          })
          setMenus(updatedMenus)
          resetCategoryForm()
        } else {
          setError(data.message || 'Eroare la actualizarea categoriei')
        }
      } else {
        // Create new category
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
          resetCategoryForm()
        } else {
          setError(data.message || 'Eroare la crearea categoriei')
        }
      }
    } catch (error) {
      setError('Eroare la procesarea categoriei')
    }
  }

  const handleEditMenu = (menu) => {
    setIsEditMode(true)
    setEditingMenuId(menu._id)
    setNewMenu({
      name: menu.name,
      isActive: menu.isActive || false,
    })
  }

  const handleEditCategory = (menu, category) => {
    setSelectedMenu(menu)
    setIsEditingCategory(true)
    setEditingCategoryId(category._id)
    setNewCategory({
      name: category.name,
      menuId: menu._id,
    })
  }

  const handleDeleteMenu = async (menuId) => {
    if (
      !confirm(
        'Sigur doriți să ștergeți acest meniu? Acest lucru va șterge și toate categoriile și referințele la produse.'
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/menu/${menuId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setMenus(menus.filter((menu) => menu._id !== menuId))
      } else {
        const data = await res.json()
        setError(data.message || 'Eroare la ștergerea meniului')
      }
    } catch (error) {
      setError('Eroare la ștergerea meniului')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCategory = async (menuId, categoryId) => {
    if (
      !confirm(
        'Sigur doriți să ștergeți această categorie? Produsele din această categorie vor fi dezlegate.'
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/menu/${menuId}/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        // Update the menus state to remove the deleted category
        const updatedMenus = menus.map((menu) => {
          if (menu._id === menuId) {
            return {
              ...menu,
              categories: menu.categories.filter(
                (cat) => cat._id !== categoryId
              ),
            }
          }
          return menu
        })
        setMenus(updatedMenus)
      } else {
        const data = await res.json()
        setError(data.message || 'Eroare la ștergerea categoriei')
      }
    } catch (error) {
      setError('Eroare la ștergerea categoriei')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetMenuForm = () => {
    setNewMenu({ name: '', isActive: false })
    setIsEditMode(false)
    setEditingMenuId(null)
    setError('')
  }

  const resetCategoryForm = () => {
    setNewCategory({ name: '', menuId: '' })
    setIsEditingCategory(false)
    setEditingCategoryId(null)
    setError('')
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
      setError('Eroare la setarea meniului activ')
    }
  }

  const handlePreviewMenu = (menu) => {
    setSelectedMenuForPreview(menu)
    setSelectedCategory(menu.categories?.[0] || null)
    setPreviewMode(true)
  }

  const getMenuItemsForCategory = (categoryId) => {
    return menuItems.filter((item) => item.categoryId === categoryId)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Se încarcă...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 w-[80%]">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!previewMode ? (
        <>
          <div className="bg-black/50 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 text-white/80">
              {isEditMode ? 'Editează Meniu' : 'Creează Meniu Nou'}
            </h2>
            <form onSubmit={handleCreateMenu} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80">
                  Nume Meniu
                  <input
                    type="text"
                    value={newMenu.name}
                    onChange={(e) =>
                      setNewMenu({ ...newMenu, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-white/80 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  <span className="ml-2 text-white/80">
                    Setează ca meniu activ
                  </span>
                </label>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4  shadow-sm text-sm font-medium rounded-md text-white bg-black   border border-white/80"
                >
                  {isEditMode ? 'Actualizează Meniu' : 'Creează Meniu'}
                </button>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={resetMenuForm}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Anulează
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-black/50 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 text-white/80">
              {isEditingCategory
                ? 'Editează Categorie'
                : 'Adaugă Categorie la Meniu'}
            </h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80">
                  Selectează Meniu
                  <select
                    value={selectedMenu?._id || ''}
                    onChange={(e) => {
                      const menu = menus.find((m) => m._id === e.target.value)
                      setSelectedMenu(menu)
                      setNewCategory({ ...newCategory, menuId: e.target.value })
                    }}
                    className="mt-1 block w-full rounded-md border border-white/80 p-2 shadow-sm sm:text-sm "
                    required
                    disabled={isEditingCategory}
                  >
                    <option className="text-black" value="">
                      Selectează un meniu
                    </option>
                    {menus.map((menu) => (
                      <option
                        className="text-black"
                        key={menu._id}
                        value={menu._id}
                      >
                        {menu.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80">
                  Nume Categorie
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-white/80 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </label>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4  shadow-sm text-sm font-medium rounded-md text-white bg-black   border border-white/80"
                >
                  {isEditingCategory
                    ? 'Actualizează Categorie'
                    : 'Adaugă Categorie'}
                </button>
                {isEditingCategory && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Anulează
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-black/50 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4 text-white/80">
              Meniuri Existente
            </h2>
            <div className="space-y-4">
              {menus.map((menu) => (
                <div key={menu._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white/80">
                      {menu.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          menu.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {menu.isActive ? 'Activ' : 'Inactiv'}
                      </span>
                      {!menu.isActive && (
                        <button
                          onClick={() => handleSetActiveMenu(menu._id)}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
                          disabled={isDeleting}
                        >
                          Setează Activ
                        </button>
                      )}
                      <button
                        onClick={() => handlePreviewMenu(menu)}
                        className="px-3 py-1 text-sm border border-white/60 rounded-md  cursor-pointer"
                        disabled={isDeleting}
                      >
                        Previzualizare Meniu
                      </button>
                      <button
                        onClick={() => handleEditMenu(menu)}
                        className="p-1 rounded-full  text-white/60 transition-colors cursor-pointer"
                        title="Editează meniu"
                        disabled={isDeleting}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(menu._id)}
                        className="p-1  rounded-full  text-red-600/90 transition-colors"
                        title="Șterge meniu"
                        disabled={isDeleting || menu.isActive}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="pl-4">
                    <h4 className="text-sm font-medium text-white/80 mb-2">
                      Categorii:
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {menu.categories?.map((category) => (
                        <li
                          key={category._id}
                          className="text-sm text-white/80 flex items-center justify-between group"
                        >
                          <span>{category.name}</span>
                          <div className="hidden group-hover:flex space-x-2">
                            <button
                              onClick={() => handleEditCategory(menu, category)}
                              className="p-1 rounded-full  text-white/60 transition-colors cursor-pointer"
                              title="Editează categorie"
                              disabled={isDeleting}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteCategory(menu._id, category._id)
                              }
                              className="p-1  rounded-full  text-red-600/90 transition-colors"
                              title="Șterge categorie"
                              disabled={isDeleting}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">
              Previzualizare Meniu: {selectedMenuForPreview?.name}
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsEditMode(true)
                  setEditingMenuId(selectedMenuForPreview._id)
                  setNewMenu({
                    name: selectedMenuForPreview.name,
                    isActive: selectedMenuForPreview.isActive || false,
                  })
                  setPreviewMode(false)
                }}
                className="px-4 py-2 bg-black text-white/80 rounded-md "
              >
                Editează Meniu
              </button>
              <button
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2  text-white/80 rounded-md border border-white/80"
              >
                Înapoi la Gestionare
              </button>
            </div>
          </div>

          <div className="bg-black/80 shadow rounded-lg p-6">
            <div className="flex flex-wrap items-center mb-6">
              <div className="flex-grow overflow-x-auto pb-2">
                <div className="flex space-x-2">
                  {selectedMenuForPreview?.categories?.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-md flex items-center cursor-pointer ${
                        selectedCategory?._id === category._id
                          ? 'bg-black text-white border border-white/80'
                          : ' text-whitre/80 '
                      }`}
                    >
                      <span>{category.name}</span>
                      {selectedCategory?._id === category._id && (
                        <div className="ml-2 flex">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCategory(
                                selectedMenuForPreview,
                                category
                              )
                              setPreviewMode(false)
                            }}
                            className="p-1  rounded-full text-white transition-colors"
                            title="Editează categorie"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (
                                confirm(
                                  'Sigur doriți să ștergeți această categorie?'
                                )
                              ) {
                                handleDeleteCategory(
                                  selectedMenuForPreview._id,
                                  category._id
                                )
                                // Reset selected category if it's deleted
                                if (selectedCategory._id === category._id) {
                                  const remainingCategories =
                                    selectedMenuForPreview.categories.filter(
                                      (c) => c._id !== category._id
                                    )
                                  setSelectedCategory(
                                    remainingCategories[0] || null
                                  )
                                  // Update the selected menu for preview to reflect the change
                                  setSelectedMenuForPreview({
                                    ...selectedMenuForPreview,
                                    categories: remainingCategories,
                                  })
                                }
                              }
                            }}
                            className="p-1 ml-1 text-red-600/80 rounded-full   transition-colors"
                            title="Șterge categorie"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 md:mt-0 ml-auto">
                <button
                  onClick={() => {
                    setSelectedMenu(selectedMenuForPreview)
                    setNewCategory({
                      name: '',
                      menuId: selectedMenuForPreview._id,
                    })
                    setPreviewMode(false)
                  }}
                  className="px-4 py-2 text-sm border  border-green-500 text-white/80 rounded-md hover:bg-green-600"
                >
                  Adaugă Categorie Nouă
                </button>
              </div>
            </div>

            {selectedCategory && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-black">
                    Produse din {selectedCategory.name}
                  </h2>
                </div>

                {getMenuItemsForCategory(selectedCategory._id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nu există produse în această categorie. Adăugați produse din
                    pagina Produse Meniu.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getMenuItemsForCategory(selectedCategory._id).map(
                      (item) => (
                        <div
                          key={item._id}
                          className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                        >
                          {item.image && (
                            <div className="h-32 w-full overflow-hidden rounded-md mb-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = '/placeholder-food.jpg'
                                }}
                              />
                            </div>
                          )}
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-black">
                                {item.name}
                              </h3>
                              <p className="text-sm text-white/80 mt-1">
                                {item.description}
                              </p>
                            </div>
                            <span className="text-lg font-semibold text-white/80">
                              {item.price.toFixed(2)}RON
                            </span>
                          </div>
                          <div className="flex flex-wrap mt-2 gap-1">
                            {item.isSpicy && (
                              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                Picant
                              </span>
                            )}
                            {item.isVegetarian && (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                Vegetarian
                              </span>
                            )}
                            {item.isVegan && (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                Vegan
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </>
            )}

            {!selectedCategory &&
              selectedMenuForPreview?.categories?.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  Vă rugăm să selectați o categorie pentru a vedea produsele
                </div>
              )}

            {selectedMenuForPreview?.categories?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Acest meniu nu are categorii. Adăugați câteva categorii pentru a
                începe.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
