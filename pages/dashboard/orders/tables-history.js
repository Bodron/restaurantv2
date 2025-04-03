import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import Head from 'next/head'

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

export default function TablesHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableOrders, setTableOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newOrderIds, setNewOrderIds] = useState(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchTables()
    }
  }, [status])

  // Add auto-refresh effect when a table is selected
  useEffect(() => {
    if (selectedTable) {
      // Initial fetch
      fetchTableOrders(selectedTable._id)

      // Set up interval for real-time updates
      const interval = setInterval(() => {
        fetchTableOrders(selectedTable._id)
      }, 5000)

      // Cleanup interval on unmount or when selected table changes
      return () => clearInterval(interval)
    }
  }, [selectedTable])

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables')
      const data = await res.json()
      setTables(data)
      setLoading(false)
    } catch (error) {
      setError('Eroare la încărcarea meselor')
      setLoading(false)
    }
  }

  const fetchTableOrders = async (tableId) => {
    try {
      // Don't show loading state on auto-refresh
      if (loading) {
        setLoading(true)
      }
      setError('')

      const res = await fetch(`/api/orders/table/${tableId}`)
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Eroare API:', errorText)
        throw new Error(`API a răspuns cu statusul ${res.status}: ${errorText}`)
      }

      const data = await res.json()

      // Get the seen orders from localStorage
      const seenOrders = JSON.parse(localStorage.getItem('seenOrders') || '{}')
      const currentTime = new Date().getTime()

      // Find new orders (orders from last 30 seconds that haven't been seen)
      const newOrders = []
      data.forEach((session) => {
        session.orders.forEach((order) => {
          const orderTime = new Date(order.createdAt).getTime()
          const timeDiff = currentTime - orderTime
          const isNew = timeDiff <= 30000 && !seenOrders[order._id]

          if (isNew) {
            // Mark this order as seen
            seenOrders[order._id] = currentTime
            newOrders.push(order._id)
          }
        })
      })

      // Update localStorage with seen orders
      localStorage.setItem('seenOrders', JSON.stringify(seenOrders))

      // Update state if we found new orders
      if (newOrders.length > 0) {
        setNewOrderIds(new Set(newOrders))
      }

      console.log('Structura datelor primite pentru comenzile mesei:', {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        firstItem:
          Array.isArray(data) && data.length > 0
            ? {
                sessionId: data[0]._id,
                ordersCount: Array.isArray(data[0].orders)
                  ? data[0].orders.length
                  : 'N/A',
                itemsInFirstOrder:
                  Array.isArray(data[0].orders) &&
                  data[0].orders.length > 0 &&
                  Array.isArray(data[0].orders[0].items)
                    ? data[0].orders[0].items.length
                    : 'N/A',
              }
            : 'Fără înregistrări',
      })
      setTableOrders(data)
      setLoading(false)
    } catch (error) {
      console.error('Eroare la încărcarea comenzilor mesei:', error)
      setError(`Eroare la încărcarea comenzilor mesei: ${error.message}`)
      setTableOrders([])
      setLoading(false)
    }
  }

  // Clear new order indicators after 30 seconds
  useEffect(() => {
    if (newOrderIds.size > 0) {
      const timer = setTimeout(() => {
        setNewOrderIds(new Set())
      }, 30000)
      return () => clearTimeout(timer)
    }
  }, [newOrderIds])

  const handleTableSelect = async (table) => {
    console.log('Masă selectată:', table)
    setSelectedTable(table)
    await fetchTableOrders(table._id)
  }

  const handleMarkAsPaid = async (sessionId) => {
    try {
      const res = await fetch(`/api/table-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paid' }),
      })

      if (res.ok) {
        // Reîmprospătează comenzile pentru masa curentă
        await fetchTableOrders(selectedTable._id)
      } else {
        const data = await res.json()
        setError(data.message)
      }
    } catch (error) {
      setError('Eroare la actualizarea stării sesiunii')
    }
  }

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
        // Reîmprospătează comenzile pentru masa curentă
        await fetchTableOrders(selectedTable._id)
      } else {
        const data = await res.json()
        setError(data.message)
      }
    } catch (error) {
      setError('Eroare la actualizarea stării comenzii')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ro-RO')
  }

  const calculateTotal = (orders) => {
    return orders.reduce((total, order) => {
      return (
        total +
        order.items.reduce((orderTotal, item) => {
          return orderTotal + item.price * item.quantity
        }, 0)
      )
    }, 0)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Se încarcă...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 min-w-[80%]">
      <Head>
        <title>Istoric Mese</title>
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

      <h2 className="text-2xl font-bold text-white mb-6">Mese</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div
            key={table._id}
            onClick={() => handleTableSelect(table)}
            className={`cursor-pointer transform transition-all duration-200 hover:scale-105 ${
              selectedTable?._id === table._id
                ? 'ring-2 ring-indigo-500'
                : 'hover:shadow-lg'
            } border-2 border-[#35605a] rounded-lg shadow p-6`}
          >
            <h3 className="text-lg font-medium text-[#31E981]">
              Masa {table.tableNumber}
            </h3>
            <p className="text-sm text-white mt-1">
              Capacitate: {table.capacity} persoane
            </p>
          </div>
        ))}
      </div>

      {selectedTable && (
        <div className="mt-8 bg-transparent rounded-lg shadow py-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Istoric Comenzi pentru Masa {selectedTable.tableNumber}
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 bg-black/50 rounded-lg border border-[#35605a]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#31E981] mb-4"></div>
              <p className="text-white">Se încarcă istoricul comenzilor...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 text-red-200 p-6 rounded-lg border border-red-800 mb-4">
              <h3 className="font-bold text-lg mb-2">Eroare</h3>
              <p>{error}</p>
              <button
                onClick={() => fetchTableOrders(selectedTable._id)}
                className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Încearcă din nou
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {Array.isArray(tableOrders) && tableOrders.length > 0 ? (
                tableOrders.map((session) => (
                  <div
                    key={session._id}
                    className="bg-black rounded-lg w-full border-2 border-[#35605a] shadow p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-[#31E981]">
                          Sesiune #{session._id.slice(-6)}
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
                            onClick={() => handleMarkAsPaid(session._id)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            Marchează ca Plătit
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-10">
                      {Array.isArray(session.orders) &&
                        session.orders.map((order) => (
                          <div
                            key={order._id}
                            className={`bg-black/80 rounded-lg py-5 px-5 space-y-5 relative ${
                              newOrderIds.has(order._id)
                                ? 'bg-[#31E981]/10'
                                : ''
                            }`}
                          >
                            {newOrderIds.has(order._id) && (
                              <div className="absolute top-[-10px] right-2 bg-[#31E981] text-black px-3 py-1 rounded-full text-sm font-bold animate-pulse">
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
                                    handleStatusChange(
                                      order._id,
                                      e.target.value
                                    )
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
                                  <option
                                    className="uppercase"
                                    value="preparing"
                                  >
                                    În Preparare
                                  </option>
                                  <option
                                    className="uppercase"
                                    value="completed"
                                  >
                                    Finalizată
                                  </option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {Array.isArray(order.items) &&
                                order.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center text-sm py-2"
                                  >
                                    {/* Item image */}
                                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 mr-3 item-image-container">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.style.display = 'none'
                                            const parent = e.target.parentNode
                                            if (
                                              !parent.querySelector(
                                                '.fallback-image'
                                              )
                                            ) {
                                              const fallback =
                                                document.createElement('div')
                                              const itemName =
                                                item.name || 'Produs'
                                              const bgColor =
                                                getColorForText(itemName)
                                              fallback.className =
                                                'fallback-image absolute inset-0 text-white text-lg font-bold'
                                              fallback.style.backgroundColor =
                                                bgColor
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
                                              item.name || 'Produs'
                                            ),
                                          }}
                                        >
                                          {(item.name || 'P')
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>
                                      )}
                                    </div>

                                    {/* Item details */}
                                    <div className="flex-1 flex justify-between items-center">
                                      <span className="text-white">
                                        {item.quantity}x{' '}
                                        {item.name || 'Produs Necunoscut'}
                                      </span>
                                      <span className="text-white">
                                        {(item.price * item.quantity).toFixed(
                                          2
                                        )}{' '}
                                        RON
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {order.notes && (
                              <div className="border-t border-gray-700 pt-4">
                                <h4 className="text-sm font-medium text-white mb-2">
                                  Note:
                                </h4>
                                <p className="text-sm text-gray-400">
                                  {order.notes}
                                </p>
                              </div>
                            )}

                            <div className="border-t border-gray-700 pt-4">
                              <div className="flex justify-between items-center font-medium text-white">
                                <span>Total Comandă</span>
                                <span>
                                  {Array.isArray(order.items) &&
                                    order.items
                                      .reduce(
                                        (sum, item) =>
                                          sum + item.price * item.quantity,
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
                      <div className="flex justify-between items-center font-medium text-lg text-white">
                        <span>Total Sesiune</span>
                        <span>
                          {Array.isArray(session.orders) &&
                            session.orders
                              .reduce(
                                (sum, order) =>
                                  sum +
                                  (Array.isArray(order.items)
                                    ? order.items.reduce(
                                        (itemSum, item) =>
                                          itemSum + item.price * item.quantity,
                                        0
                                      )
                                    : 0),
                                0
                              )
                              .toFixed(2)}{' '}
                          RON
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-white bg-black/50 p-6 rounded-lg border border-[#35605a] text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-xl">
                    Nu există comenzi înregistrate pentru această masă.
                  </p>
                  <p className="text-gray-400 mt-2">
                    Comenzile vor apărea aici după ce clienții le plasează.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
