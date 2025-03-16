import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function OrdersManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tableSessions, setTableSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()

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
          }
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
      setError('Error fetching orders')
      setLoading(false)
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
        fetchOrders()
      } else {
        const data = await res.json()
        setError(data.message)
      }
    } catch (error) {
      setError('Error updating order status')
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
      setError('Error marking session as paid')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {tableSessions.map((session) => (
          <div
            key={session.sessionId}
            className="bg-white rounded-lg shadow p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Table {session.tableNumber}
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
                  {session.status.toUpperCase()}
                </span>
                {session.status !== 'paid' && (
                  <button
                    onClick={() => handleMarkSessionAsPaid(session.sessionId)}
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
                  className="bg-gray-50 rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">
                        Order #{order._id.slice(-6)}
                      </h4>
                      <p className="text-sm text-gray-700">
                        Placed: {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'preparing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-900">
                          {item.quantity}x {item.menuItem?.name}
                        </span>
                        <span className="text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Notes:
                      </h4>
                      <p className="text-sm text-gray-700">{order.notes}</p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-gray-900">Order Total</span>
                      <span className="text-gray-900">
                        $
                        {order.items
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center font-medium text-lg">
                <span className="text-gray-900">Session Total</span>
                <span className="text-gray-900">
                  ${session.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
