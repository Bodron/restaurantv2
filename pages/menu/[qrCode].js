import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import {
  XMarkIcon,
  ShoppingCartIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

export default function CustomerMenu() {
  const router = useRouter()
  const { qrCode } = router.query

  const [table, setTable] = useState(null)
  const [menu, setMenu] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orderNotes, setOrderNotes] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    if (qrCode) {
      fetchTableAndMenu()
    }
  }, [qrCode])

  useEffect(() => {
    if (menu?.categories?.length > 0 && !activeCategory) {
      setActiveCategory(menu.categories[0]._id)
    }
  }, [menu])

  const fetchTableAndMenu = async () => {
    try {
      // Fetch table info
      const tableRes = await fetch(`/api/tables/qr/${qrCode}`)
      if (!tableRes.ok) throw new Error('Table not found')
      const tableData = await tableRes.json()
      setTable(tableData)

      // Fetch active menu
      const menuRes = await fetch(
        `/api/menu/restaurant/${tableData.restaurant._id}`
      )
      if (!menuRes.ok) throw new Error('Menu not found')
      const menuData = await menuRes.json()
      setMenu(menuData)

      // Fetch menu items
      const itemsRes = await fetch(
        `/api/menu-items/restaurant/${tableData.restaurant._id}`
      )
      if (!itemsRes.ok) throw new Error('Failed to fetch menu items')
      const itemsData = await itemsRes.json()
      setMenuItems(itemsData)

      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.menuItemId === item._id
      )
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.menuItemId === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [
        ...prevCart,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          notes: '',
        },
      ]
    })
  }

  const removeFromCart = (menuItemId) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.menuItemId === menuItemId
      )
      if (existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      }
      return prevCart.filter((item) => item.menuItemId !== menuItemId)
    })
  }

  const updateItemNotes = (menuItemId, notes) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.menuItemId === menuItemId ? { ...item, notes } : item
      )
    )
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const placeOrder = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: table._id,
          items: cart,
          notes: orderNotes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      setOrderSuccess(true)
      setCart([])
      setOrderNotes('')
    } catch (err) {
      setError('Failed to place order. Please try again.')
    }
  }

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>{table?.restaurant?.name || 'Restaurant Menu'}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      {/* Header with back button and search */}
      <header className="sticky top-0 z-30 bg-black px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <button onClick={() => router.back()} className="p-2 rounded-full">
          <ChevronLeftIcon className="h-6 w-6 text-white" />
        </button>

        <h1 className="text-xl font-bold text-white">
          {table?.restaurant?.name || 'Restaurant Menu'}
        </h1>

        <button className="p-2 rounded-full">
          <MagnifyingGlassIcon className="h-6 w-6 text-white" />
        </button>
      </header>

      {/* Category tabs */}
      <div className="sticky top-14 z-20 bg-black border-b border-gray-800">
        <div className="overflow-x-auto whitespace-nowrap py-2 px-4 scrollbar-hide">
          {menu?.categories?.map((category) => (
            <button
              key={category._id}
              onClick={() => setActiveCategory(category._id)}
              className={`px-4 py-2 mx-1 text-sm font-medium rounded-full ${
                activeCategory === category._id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {orderSuccess && (
        <div className="bg-green-100 text-green-800 px-4 py-3 mx-4 my-2 rounded-lg">
          Order placed successfully! Your food will be prepared shortly.
        </div>
      )}

      {/* Menu Items - Only showing active category */}
      <div className="pb-24">
        {menu?.categories?.map((category) => (
          <div
            key={category._id}
            className={`${
              activeCategory === category._id ? 'block' : 'hidden'
            }`}
          >
            {menuItems
              .filter((item) => item.categoryId === category._id)
              .map((item) => (
                <div
                  key={item._id}
                  className="flex p-4 border-b border-gray-800"
                >
                  {/* Left: Image placeholder - you'll add real images later */}
                  <div className="w-28 h-28 bg-gray-800 rounded-lg mr-3 overflow-hidden">
                    <div
                      className="w-full h-full bg-gray-700 flex items-center justify-center"
                      style={{
                        backgroundImage: `url("/images/pizza.jpg")`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                      }}
                    ></div>
                  </div>

                  {/* Right: Item details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title and price */}
                      <div className="flex justify-between">
                        <h3 className="text-white font-medium">{item.name}</h3>
                        <div>
                          <div className="text-white text-right">
                            ${item.price.toFixed(2)}
                          </div>
                          {/* You can add discounted price here like in the image */}
                          <div className="text-gray-500 text-right line-through text-sm">
                            ${(item.price * 1.3).toFixed(2)}
                          </div>
                          <div className="border border-white/30 text-white/80 rounded-full text-xs px-2 py-1  mt-1 text-center">
                            -30%
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Add button */}
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => addToCart(item)}
                        className="w-6 h-6 border border-white/80 rounded-full flex items-center justify-center text-white/80"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Footer with order info and button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 py-3 px-4 flex justify-between items-center z-20">
          <div>
            <p className="text-sm text-gray-400">
              Your order ({cart.reduce((sum, item) => sum + item.quantity, 0)}{' '}
              items)
            </p>
            <p className="text-white font-bold">
              ${calculateTotal().toFixed(2)}
            </p>
          </div>
          <button
            onClick={toggleCart}
            className="bg-green-600 text-white px-4 py-2 rounded-full font-medium"
          >
            View Cart
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full bg-black border-l border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-40 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="border-b border-gray-800 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Your Order</h2>
            <button
              onClick={toggleCart}
              className="p-2 rounded-full hover:bg-gray-800"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center p-6">
              <ShoppingCartIcon className="h-16 w-16 text-gray-600 mb-4" />
              <p className="text-gray-400">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="flex-grow overflow-y-auto p-4">
                {cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex justify-between items-center p-3 border-b border-gray-800"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-gray-400 text-sm">
                        ${item.price.toFixed(2)}
                      </p>
                      {item.notes && (
                        <p className="text-gray-500 text-xs">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="w-7 h-7 rounded-full border border-gray-600 flex items-center justify-center"
                      >
                        <span className="text-white">-</span>
                      </button>
                      <span className="text-white w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          addToCart({ _id: item.menuItemId, ...item })
                        }
                        className="w-7 h-7 rounded-full border border-gray-600 flex items-center justify-center"
                      >
                        <span className="text-white">+</span>
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <textarea
                    placeholder="Add notes to your order..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-lg resize-none"
                    rows="3"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-800">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-white">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={placeOrder}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium"
                >
                  Place Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overlay when cart is open */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30"
          onClick={toggleCart}
        ></div>
      )}

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
    </div>
  )
}
