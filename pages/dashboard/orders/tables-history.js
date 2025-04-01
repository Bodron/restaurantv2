import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { QRCodeSVG as QRCode } from 'qrcode.react'
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
  console.log('CONSOLE LOG TABLEORDER', tableOrders)
  return (
    <div className="space-y-6 p-6 min-w-[80%]">
      <h2 className="text-2xl font-bold text-white mb-6">Tables</h2>
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
              Table {table.tableNumber}
            </h3>
            <p className="text-sm text-white mt-1">
              Capacity: {table.capacity} persons
            </p>
            {/* {table.qrCode && (
              <>
              <p className="text-sm text-white mt-1">
                QR Code: 
                {/* {table.qrCode} 
              </p>
              <QRCode
              value={`${
                typeof window !== 'undefined' ? window.location.origin : ''
              }/menu/${table.qrCode}`}
              size={200}
              level="H"
            /></>
            )} */}
          </div>
        ))}
      </div>

      {selectedTable && (
        <div className="mt-8 bg-transparent rounded-lg shadow py-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Order History for Table {selectedTable.tableNumber}
          </h2>

          <div className="space-y-8">
            {tableOrders.map((session) => (
              <div
                key={session._id}
                className="bg-black rounded-lg w-full border-2 border-[#35605a] shadow p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-[#31E981]">
                      Session #{session._id.slice(-6)}
                    </h3>
                    <p className="text-sm text-white">
                      Started: {formatDate(session.startTime)}
                    </p>
                    {session.endTime && (
                      <p className="text-sm text-white">
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

                <div className="space-y-10">
                  {session.orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-stone-800 rounded-lg py-5 px-5 space-y-5"
                    >
                      <div className="flex justify-between items-start gap-10">
                        <div>
                          <h4 className="text-md font-medium text-white">
                            Order #{order._id.slice(-6)}
                          </h4>
                          <p className="text-sm text-white">
                            Placed: {formatDate(order.createdAt)}
                          </p>
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
                              Pending
                            </option>
                            <option className="uppercase" value="preparing">
                              Preparing
                            </option>
                            <option className="uppercase" value="completed">
                              Completed
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm text-white"
                          >
                            <span>
                              {item.quantity}x {item.menuItem?.name}
                            </span>
                            <span>
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-white mb-2">
                            Notes:
                          </h4>
                          <p className="text-sm text-gray-700">{order.notes}</p>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center font-medium text-white">
                          <span>Order Total</span>
                          <span>
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

                <div className="border-t border-[#31E981] pt-4">
                  <div className="flex justify-between items-center font-medium text-lg text-white">
                    <span>Session Total</span>
                    <span>
                      $
                      {session.orders
                        .reduce(
                          (sum, order) =>
                            sum +
                            order.items.reduce(
                              (itemSum, item) =>
                                itemSum + item.price * item.quantity,
                              0
                            ),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {tableOrders.length < 1 &&
              'There are no registered orders available for this table.'}
          </div>
        </div>
      )}
    </div>
  )
}
