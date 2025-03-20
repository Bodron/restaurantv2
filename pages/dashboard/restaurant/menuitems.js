import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Head from 'next/head'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function MenuItemsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menus, setMenus] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [allCategories, setAllCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    menuId: '',
    categoryId: '',
    image: '',
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

  useEffect(() => {
    // Extract all unique categories from menus
    if (menus.length > 0) {
      const categories = menus.flatMap((menu) => menu.categories || [])
      setAllCategories(categories)

      // Set first category as active if none is selected
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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file) => {
    if (!file) return null

    console.log('Uploading image:', file.name)
    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('image', file)

      // Upload to S3 via API
      const response = await fetch('/api/menu-items/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(90)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Upload error response:', errorData)
        throw new Error(
          errorData.message ||
            `Failed to upload image: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()
      console.log('Upload successful, image URL:', data.imageUrl)
      setUploadProgress(100)
      return data.imageUrl
    } catch (error) {
      console.error('Upload error details:', error)
      setError(`Failed to upload image: ${error.message || 'Unknown error'}`)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateMenuItem = async (e) => {
    e.preventDefault()

    try {
      // First upload the image if one was selected
      let imageUrl = newMenuItem.image
      const fileInput = fileInputRef.current

      if (fileInput && fileInput.files[0]) {
        imageUrl = await uploadImage(fileInput.files[0])
        if (!imageUrl) {
          // Image upload failed
          return
        }
      }

      if (isEditMode && editingItemId) {
        // Update existing menu item
        const res = await fetch(`/api/menu-items/${editingItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newMenuItem,
            image: imageUrl,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          setMenuItems(
            menuItems.map((item) =>
              item._id === editingItemId
                ? { ...data, _id: editingItemId }
                : item
            )
          )
          resetForm()
          setError('')
        } else {
          setError(data.message || 'Error updating menu item')
        }
      } else {
        // Create new menu item
        const res = await fetch('/api/menu-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newMenuItem,
            image: imageUrl,
          }),
        })

        const data = await res.json()
        if (res.ok) {
          setMenuItems([...menuItems, data])
          resetForm()
          setError('')
        } else {
          setError(data.message || 'Error creating menu item')
        }
      }
    } catch (error) {
      setError('Error processing menu item')
    }
  }

  const handleDeleteMenuItem = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
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
        setError(data.message || 'Error deleting menu item')
      }
    } catch (error) {
      setError('Error deleting menu item')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditMenuItem = (item) => {
    setIsEditMode(true)
    setEditingItemId(item._id)
    setNewMenuItem({
      name: item.name,
      description: item.description || '',
      price: item.price,
      menuId: item.menuId,
      categoryId: item.categoryId,
      image: item.image || '',
    })
    setPreviewImage(item.image || null)

    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setNewMenuItem({
      name: '',
      description: '',
      price: '',
      menuId: '',
      categoryId: '',
      image: '',
    })
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsEditMode(false)
    setEditingItemId(null)
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
      <div className="flex items-center justify-center h-full">Loading...</div>
    )
  }

  return (
    <div className="space-y-6 p-6 w-[80%]">
      <Head>
        <title>Menu Items</title>
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </Head>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-black/80 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 text-white/70">
          {isEditMode ? 'Edit Menu Item' : 'Add Menu Item'}
        </h2>
        <form onSubmit={handleCreateMenuItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70">
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
            <label className="block text-sm font-medium text-white/70">
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
            <label className="block text-sm font-medium text-white/70">
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
            <label className="block text-sm font-medium text-white/70">
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
            <label className="block text-sm font-medium text-white/70">
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

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-white/70">
              Item Image
              <div className="mt-1 flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="block text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                />

                {/* Manual image URL input */}
              </div>
              {/* Image Preview */}
              {(previewImage || newMenuItem.image) && (
                <div className="mt-2">
                  <div className="relative w-32 h-32 overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={previewImage || newMenuItem.image}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null)
                        setNewMenuItem({ ...newMenuItem, image: '' })
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </label>
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="inline-flex justify-center  px-4 border  shadow-sm text-sm  text-whiteborder border-[#31E981] text-white py-3 rounded-lg font-medium"
              disabled={isUploading}
            >
              {isUploading
                ? 'Uploading...'
                : isEditMode
                ? 'Update Menu Item'
                : 'Add Menu Item'}
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white/70 bg-black/80 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-black/80 shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-medium text-white/70">Menu Items</h2>

          {/* Search input */}
          <div className="mt-2 md:mt-0 relative">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-auto"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute right-2 top-2.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Category tabs */}
        {allCategories.length > 0 && (
          <div className="overflow-x-auto whitespace-nowrap py-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 mx-1 text-sm font-medium rounded-full 
                ${
                  !activeCategory
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
            >
              All Items
            </button>
            {allCategories.map((category) => (
              <button
                key={category._id}
                onClick={() => setActiveCategory(category._id)}
                className={`px-4 py-2 mx-1 text-sm font-medium rounded-full 
                  ${
                    activeCategory === category._id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No menu items found.{' '}
            {searchTerm ? 'Try a different search term or ' : ''}
            {activeCategory ? 'try selecting a different category.' : ''}
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
                        <span>No image</span>
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
                          )?.name || 'Uncategorized'}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-indigo-600 font-semibold text-xl">
                          ${item.price.toFixed(2)}
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleEditMenuItem(item)}
                            className="p-1.5 bg-indigo-50 rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
                            title="Edit menu item"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item._id)}
                            className="p-1.5 bg-red-50 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                            title="Delete menu item"
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

// Add scrollbar hiding style
export const getServerSideProps = () => {
  return {
    props: {},
  }
}

const styles = {
  scrollbarHide: {
    MsOverflowStyle: 'none',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
  lineClamp2: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
}
