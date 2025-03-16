import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import DashboardLayout from '../../components/DashboardLayout'

export default function OrdersManagement() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()

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
            totalAmount: order.tableSession.totalAmount,
            orders: [],
          }
        }
        groups[sessionId].orders.push(order)
        return groups
      }, {})

      setOrders(Object.values(groupedOrders))
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update order status')

      // Refresh orders after update
      fetchOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  const closeTableSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/table-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paid' }),
      })

      if (!response.ok) throw new Error('Failed to close table session')

      // Refresh orders after update
      fetchOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getSessionStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paid: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-red-600">{error}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Orders Management</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Orders Management
        </h1>

        <div className="space-y-8">
          {orders.map((tableSession) => (
            <div
              key={tableSession.sessionId}
              className="bg-white shadow overflow-hidden sm:rounded-lg"
            >
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Table {tableSession.tableNumber}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Session started:{' '}
                      {new Date(tableSession.startTime).toLocaleString()}
                    </p>
                    {tableSession.endTime && (
                      <p className="mt-1 text-sm text-gray-500">
                        Session ended:{' '}
                        {new Date(tableSession.endTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSessionStatusColor(
                        tableSession.status
                      )}`}
                    >
                      {tableSession.status}
                    </span>
                    <span className="text-lg font-semibold">
                      Total: ${tableSession.totalAmount.toFixed(2)}
                    </span>
                    {tableSession.status === 'active' && (
                      <button
                        onClick={() =>
                          closeTableSession(tableSession.sessionId)
                        }
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <ul className="divide-y divide-gray-200">
                {tableSession.orders.map((order) => (
                  <li key={order._id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Order placed:{' '}
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        {order.notes && (
                          <p className="mt-2 text-sm text-gray-500">
                            Notes: {order.notes}
                          </p>
                        )}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900">
                            Items:
                          </h4>
                          <ul className="mt-2 divide-y divide-gray-200">
                            {order.items.map((item, index) => (
                              <li key={index} className="py-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.menuItem.name}
                                    </p>
                                    {item.notes && (
                                      <p className="text-sm text-gray-500">
                                        Note: {item.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <p className="text-sm text-gray-500">
                                      Quantity: {item.quantity}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-4 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Order Total: ${order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-6">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order._id, e.target.value)
                          }
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
