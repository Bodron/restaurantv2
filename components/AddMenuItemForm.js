import React, { useState, useRef } from 'react'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 600,
  bgcolor: '#000',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
}

export default function AddMenuItemModal({ menus, onItemAdded }) {
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    resetForm()
    setOpen(false)
  }

  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    menuId: '',
    categoryId: '',
    image: '',
  })
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file) => {
    if (!file) return null

    setIsUploading(true)
    setUploadProgress(10)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await fetch('/api/menu-items/upload', {
        method: 'POST',
        body: formData,
      })
      setUploadProgress(90)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload image')
      }
      const data = await response.json()
      setUploadProgress(100)
      return data.imageUrl
    } catch (error) {
      setError(`Failed to upload image: ${error.message || 'Unknown error'}`)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateMenuItem = async (e) => {
    e.preventDefault()
    try {
      let imageUrl = newMenuItem.image
      const fileInput = fileInputRef.current
      if (fileInput && fileInput.files[0]) {
        imageUrl = await uploadImage(fileInput.files[0])
        if (!imageUrl) return
      }
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
        onItemAdded(data)
        resetForm()
        setError('')
        handleClose()
      } else {
        setError(data.message || 'Error creating menu item')
      }
    } catch (error) {
      setError('Error processing menu item')
    }
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
  }

  return (
    <div>
      <button
        onClick={handleOpen}
        className="inline-flex justify-center px-4 border shadow-sm text-sm text-white border-[#31E981] py-3 rounded-lg font-medium cursor-pointer"
      >
        Add Menu Item
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="add-menu-item-modal"
        aria-describedby="modal-for-adding-menu-item"
      >
        <Box sx={modalStyle}>
          <Typography
            id="add-menu-item-modal"
            variant="h6"
            component="h2"
            className="mb-4"
          >
            Add Menu Item
          </Typography>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateMenuItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60">
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
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  required
                >
                  <option className="text-black" value="">
                    Select a menu
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
              <label className="block text-sm font-medium text-white/60">
                Category
                <select
                  value={newMenuItem.categoryId}
                  onChange={(e) =>
                    setNewMenuItem({
                      ...newMenuItem,
                      categoryId: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  required
                  disabled={!newMenuItem.menuId}
                >
                  <option className="text-black" value="">
                    Select a category
                  </option>
                  {menus
                    .find((menu) => menu._id === newMenuItem.menuId)
                    ?.categories?.map((category) => (
                      <option
                        className="text-black"
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60">
                Name
                <input
                  type="text"
                  value={newMenuItem.name}
                  onChange={(e) =>
                    setNewMenuItem({ ...newMenuItem, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60">
                Description
                <textarea
                  value={newMenuItem.description}
                  onChange={(e) =>
                    setNewMenuItem({
                      ...newMenuItem,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60">
                Price
                <input
                  type="number"
                  step="0.01"
                  value={newMenuItem.price}
                  onChange={(e) =>
                    setNewMenuItem({
                      ...newMenuItem,
                      price: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60">
                Item Image
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
                {(previewImage || newMenuItem.image) && (
                  <div className="mt-2 relative w-32 h-32 overflow-hidden rounded-lg border border-gray-200">
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
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
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
                className="inline-flex justify-center px-4 border shadow-sm text-sm text-white border-[#31E981] py-3 rounded-lg font-medium cursor-pointer"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Add Menu Item'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className=" py-2 px-4 border border-gray-300 bg-black shadow-sm text-sm font-medium rounded-md text-white  cursor-pointer"
              >
                Reset
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  )
}
