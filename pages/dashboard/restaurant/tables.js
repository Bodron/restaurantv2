import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { QRCodeSVG as QRCode } from 'qrcode.react'

export default function TablesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 4 })

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
      console.log('Fetching tables...')
      const res = await fetch('/api/tables')
      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Tables data:', data)

      if (!res.ok) {
        setError(data.message || 'Failed to fetch tables')
        setTables([])
        return
      }

      setTables(Array.isArray(data) ? data : [])
      setError('')
    } catch (error) {
      console.error('Error fetching tables:', error)
      setError('Error fetching tables')
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTable = async (e) => {
    e.preventDefault()
    try {
      if (!session?.user?.restaurantId) {
        setError('Please create a restaurant first')
        return
      }

      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTable),
      })
      const data = await res.json()
      if (res.ok) {
        setTables([...tables, data])
        setNewTable({ tableNumber: '', capacity: 4 })
        setError('')
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error creating table')
    }
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

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 text-black">Add New Table</h2>
        <form onSubmit={handleCreateTable} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Table Number
              <input
                type="number"
                value={newTable.tableNumber}
                onChange={(e) =>
                  setNewTable({
                    ...newTable,
                    tableNumber: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Capacity
              <input
                type="number"
                value={newTable.capacity}
                onChange={(e) =>
                  setNewTable({ ...newTable, capacity: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Table
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 text-black">Tables</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables?.map((table) => (
            <div key={table._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-black">
                    Table {table.tableNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Capacity: {table.capacity}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {table.status}
                  </p>
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <QRCode
                  value={`${
                    typeof window !== 'undefined' ? window.location.origin : ''
                  }/menu/${table.qrCode}`}
                  size={200}
                  level="H"
                />
              </div>
              <button
                onClick={() => window.print()}
                className="w-full py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Print QR Code
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
