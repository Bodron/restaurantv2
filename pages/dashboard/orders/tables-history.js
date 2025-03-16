import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function TablesHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableOrders, setTableOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchTables()
    }
  }, [status])

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables')
      const data = await res.json()
      setTables(data)
      setLoading(false)
    } catch (error) {
      setError('Error fetching tables')
      setLoading(false)
    }
  }

  const fetchTableOrders = async (tableId) => {
    try {
      console.log('Fetching orders for table:', tableId)
      const res = await fetch(`/api/orders/table/${tableId}`)
      const data = await res.json()
      console.log('Received table orders:', data)
      setTableOrders(data)
      setError('')
    } catch (error) {
      console.error('Error fetching table orders:', error)
      setError('Error fetching table orders')
    }
  }

  const handleTableSelect = async (table) => {
    console.log('Selected table:', table)
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
        // Refresh the orders for the current table
        await fetchTableOrders(selectedTable._id)
      } else {
        const data = await res.json()
        setError(data.message)
      }
    } catch (error) {
      setError('Error updating session status')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
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
      <div className="flex items-center justify-center h-full">Loading...</div>
    )
  }
  console.log(tables)
  return (
    <div className="space-y-6 p-6">
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
            } bg-white rounded-lg shadow p-6`}
          >
            <h3 className="text-lg font-medium text-gray-900">
              Table {table.tableNumber}
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Capacity: {table.capacity} persons
            </p>
            {table.qrCode && (
              <p className="text-sm text-gray-700 mt-1">
                QR Code: {table.qrCode}
              </p>
            )}
          </div>
        ))}
      </div>

      {selectedTable && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Order History for Table {selectedTable.number}
          </h2>

          <div className="space-y-8">
            {tableOrders.map((session) => (
              <div
                key={session._id}
                className="border rounded-lg p-6 space-y-4 bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Session #{session._id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-700">
                      Started: {formatDate(session.startTime)}
                    </p>
                    {session.endTime && (
                      <p className="text-sm text-gray-700">
                        Ended: {formatDate(session.endTime)}
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
                      {session.status.charAt(0).toUpperCase() +
                        session.status.slice(1)}
                    </span>
                    {session.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkAsPaid(session._id)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {session.orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">
                            Order #{order._id.slice(-6)}
                          </h4>
                          <p className="text-sm text-gray-700">
                            Placed: {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.status.split('_').join(' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm text-gray-900"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-900 font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center font-medium text-gray-900">
                          <span>Total</span>
                          <span>${calculateTotal([order]).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center font-medium text-lg text-gray-900">
                    <span>Session Total</span>
                    <span>${calculateTotal(session.orders).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
