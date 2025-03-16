import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

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

  useEffect(() => {
    if (qrCode) {
      fetchTableAndMenu()
    }
  }, [qrCode])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>{table?.restaurant?.name || 'Restaurant Menu'}</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-2 text-black">
            {table?.restaurant?.name}
          </h1>
          <p className="text-gray-600">Table {table?.tableNumber}</p>
        </div>

        {orderSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-8">
            Order placed successfully! Your food will be prepared shortly.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 text-black">Menu</h2>
              {menu?.categories?.map((category) => (
                <div key={category._id} className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-black">
                    {category.name}
                  </h3>
                  <div className="space-y-4">
                    {menuItems
                      .filter((item) => item.categoryId === category._id)
                      .map((item) => (
                        <div
                          key={item._id}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-black">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-gray-600 text-sm mt-1">
                                {item.description}
                              </p>
                            )}
                            <p className="text-gray-900 font-medium mt-1">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => addToCart(item)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            Add to Order
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-semibold mb-6 text-black">
                Your Order
              </h2>
              {cart.length === 0 ? (
                <p className="text-gray-600">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex flex-col p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-black">
                            {item.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeFromCart(item.menuItemId)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              -
                            </button>
                            <span className="text-black">{item.quantity}</span>
                            <button
                              onClick={() =>
                                addToCart({ _id: item.menuItemId, ...item })
                              }
                              className=" hover:text-gray-800 text-black"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="Special instructions..."
                          value={item.notes}
                          onChange={(e) =>
                            updateItemNotes(item.menuItemId, e.target.value)
                          }
                          className="w-full p-2 text-sm border rounded"
                        />
                        <div className="text-right mt-2 text-black">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mb-6">
                    <textarea
                      placeholder="Any notes for your order?"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full p-2 border rounded"
                      rows="3"
                    />
                  </div>
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-black">Total:</span>
                      <span className="text-black">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={placeOrder}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
                  >
                    Place Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
