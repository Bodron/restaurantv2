import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { BellIcon } from '@heroicons/react/24/outline'

// Helper function to generate consistent background colors based on text
const getColorForText = (text) => {
  // Generate a hash code from text
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  // Generate consistent colors in the gray to indigo/purple range for a cohesive dark theme
  const hue = ((hash % 60) + 210) % 360 // Range between 210-270 (blues/purples)
  const saturation = 40 + (hash % 30) // 40-70%
  const lightness = 20 + (hash % 15) // 20-35%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export default function OrdersManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tableSessions, setTableSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasNewOrders, setHasNewOrders] = useState(false)
  const [newOrderIds, setNewOrderIds] = useState(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchOrders()
      const interval = setInterval(fetchOrders, 5000)
      return () => clearInterval(interval)
    }
  }, [status])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()

      // Get the seen orders from localStorage
      const seenOrders = JSON.parse(localStorage.getItem('seenOrders') || '{}')
      const currentTime = new Date().getTime()

      // Find new orders (orders from last 30 seconds that haven't been seen)
      const newOrders = data.filter((order) => {
        const orderTime = new Date(order.createdAt).getTime()
        const timeDiff = currentTime - orderTime
        const isNew = timeDiff <= 30000 && !seenOrders[order._id]

        if (isNew) {
          // Mark this order as seen
          seenOrders[order._id] = currentTime
        }

        return isNew
      })

      // Update localStorage with seen orders
      localStorage.setItem('seenOrders', JSON.stringify(seenOrders))

      // Update state if we found new orders
      if (newOrders.length > 0) {
        setHasNewOrders(true)
        setNewOrderIds(new Set(newOrders.map((order) => order._id)))
      }

      // Group orders by table session
      const groupedOrders = data.reduce((groups, order) => {
        const sessionId = order.tableSession._id
        if (!groups[sessionId]) {
          groups[sessionId] = {
            sessionId: sessionId,
            tableNumber: order.table.tableNumber,
            status: order.tableSession.status,
            startTime: order.tableSession.startTime,
            endTime: order.tableSession.endTime,
            orders: [],
            totalAmount: 0,
            hasNewOrder: false,
          }
        }

        // Check if this order is new
        if (newOrders.some((newOrder) => newOrder._id === order._id)) {
          groups[sessionId].hasNewOrder = true
        }

        groups[sessionId].orders.push(order)
        groups[sessionId].totalAmount += order.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
        return groups
      }, {})

      setTableSessions(Object.values(groupedOrders))
      setLoading(false)
    } catch (error) {
      setError('Eroare la încărcarea comenzilor')
      setLoading(false)
    }
  }

  // Clear new order indicators after 30 seconds
  useEffect(() => {
    if (newOrderIds.size > 0) {
      const timer = setTimeout(() => {
        setNewOrderIds(new Set())
        setHasNewOrders(false)
      }, 30000)
      return () => clearTimeout(timer)
    }
  }, [newOrderIds])

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchOrders()
      } else {
        const data = await res.json()
        setError(data.message)
      }
    } catch (error) {
      setError('Eroare la actualizarea statusului comenzii')
    }
  }

  const handleMarkSessionAsPaid = async (sessionId) => {
    try {
      const res = await fetch(`/api/table-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paid' }),
      })

      if (res.ok) {
        fetchOrders()
      } else {
        const data = await res.json()
        setError(data.message)
      }
    } catch (error) {
      setError('Eroare la marcarea sesiunii ca plătită')
    }
  }

  const handleNotificationClick = () => {
    setHasNewOrders(false)
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ro-RO')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Se încarcă...
      </div>
    )
  }

  return (
    <div className="space-y-6 py-[5%] max-w-[80%] w-full">
      <Head>
        <title>Gestionare Comenzi</title>
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .item-image-container {
            position: relative;
            overflow: hidden;
          }
          .fallback-image {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
          }
        `}</style>
      </Head>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/*    {hasNewOrders && (
        <div
          onClick={handleNotificationClick}
          className="fixed top-4 right-4 bg-[#31E981] text-black px-4 py-2 rounded-full flex items-center space-x-2 cursor-pointer shadow-lg hover:bg-[#2ad374] transition-colors"
        >
          <BellIcon className="h-5 w-5" />
          <span>Comenzi noi!</span>
        </div>
      )} */}

      <div className="grid grid-cols-1 gap-6">
        {tableSessions.map((session) => (
          <div
            key={session.sessionId}
            className={`bg-black rounded-lg w-full border-2 ${
              session.hasNewOrder ? 'border-[#31E981]' : 'border-[#35605a]'
            } shadow p-6 space-y-4`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-[#31E981]">
                  Masa {session.tableNumber}
                </h3>
                <p className="text-sm text-white">
                  Început: {formatDate(session.startTime)}
                </p>
                {session.endTime && (
                  <p className="text-sm text-white">
                    Sfârșit: {formatDate(session.endTime)}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    session.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {session.status === 'paid' ? 'PLĂTIT' : 'ACTIV'}
                </span>
                {session.status !== 'paid' && (
                  <button
                    onClick={() => handleMarkSessionAsPaid(session.sessionId)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    Marchează ca Plătit
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-10">
              {session.orders.map((order) => (
                <div
                  key={order._id}
                  className={`rounded-lg py-5 px-5 space-y-5 relative ${
                    newOrderIds.has(order._id) ? 'bg-[#31E981]/10' : ''
                  }`}
                >
                  {newOrderIds.has(order._id) && (
                    <div className="absolute top-14 right-2 bg-[#31E981] text-black px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                      Comandă Nouă!
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-10">
                    <div>
                      <h4 className="text-md font-medium text-white">
                        Comanda #{order._id.slice(-6)}
                      </h4>
                      <p className="text-sm text-white">
                        Plasată: {formatDate(order.createdAt)}
                      </p>
                      {order.isGuestOrder && (
                        <p className="text-sm text-gray-400">
                          Client: {order.guestName || 'Anonim'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className={`px-2 py-1 text-xs uppercase font-semibold rounded ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'preparing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <option className="uppercase" value="pending">
                          În Așteptare
                        </option>
                        <option className="uppercase" value="preparing">
                          În Preparare
                        </option>
                        <option className="uppercase" value="completed">
                          Finalizată
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm py-2"
                      >
                        {/* Item image */}
                        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 mr-3 item-image-container">
                          {item.menuItem?.image ? (
                            <img
                              src={item.menuItem.image}
                              alt={item.menuItem?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                // Add a fallback div with menu item's first letter when image fails
                                const parent = e.target.parentNode
                                if (!parent.querySelector('.fallback-image')) {
                                  const fallback = document.createElement('div')
                                  const itemName =
                                    item.menuItem?.name || 'Produs'
                                  const bgColor = getColorForText(itemName)
                                  fallback.className =
                                    'fallback-image absolute inset-0 text-white text-lg font-bold'
                                  fallback.style.backgroundColor = bgColor
                                  fallback.textContent = itemName
                                    .charAt(0)
                                    .toUpperCase()
                                  parent.appendChild(fallback)
                                }
                              }}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white text-lg font-bold"
                              style={{
                                backgroundColor: getColorForText(
                                  item.menuItem?.name || 'Produs'
                                ),
                              }}
                            >
                              {(item.menuItem?.name || 'P')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Item details */}
                        <div className="flex-1 flex justify-between items-center">
                          <span className="text-white">
                            {item.quantity}x{' '}
                            {item.menuItem?.name || 'Produs Necunoscut'}
                            {item.notes && (
                              <span className="text-xs text-gray-400 block mt-1">
                                Notă: {item.notes}
                              </span>
                            )}
                          </span>
                          <span className="text-white">
                            {(item.price * item.quantity).toFixed(2)} RON
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="border-t border-gray-800 pt-4">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Note Comandă:
                      </h4>
                      <p className="text-sm text-gray-400">{order.notes}</p>
                    </div>
                  )}

                  <div className="border-t border-gray-800 pt-4">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-white">Total Comandă</span>
                      <span className="text-white">
                        {order.items
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          )
                          .toFixed(2)}{' '}
                        RON
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#31E981] pt-4">
              <div className="flex justify-between items-center font-medium text-lg">
                <span className="text-white">Total Sesiune</span>
                <span className="text-white">
                  {session.totalAmount.toFixed(2)} RON
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
