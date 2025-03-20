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
      const res = await fetch('/api/tables')
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to fetch tables')
        setTables([])
        return
      }

      setTables(Array.isArray(data) ? data : [])
      setError('')
    } catch (error) {
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
    <div className="space-y-6 py-[5%] max-w-[80%] w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

<div className="bg-transparent rounded-lg w-fit shadow pY-6 space-y-4">
  <h2 className="text-lg font-medium text-[#31E981]">Add New Table</h2>
  <form onSubmit={handleCreateTable} className="space-y-4">
    <div className="flex flex-row justify-between items-center gap-6 ">
      <div className="flex flex-col w-1/2">
        <label className="block text-sm font-medium text-white">Table Number</label>
        <input
          type="number"
          value={newTable.tableNumber}
          onChange={(e) =>
            setNewTable({
              ...newTable,
              tableNumber: e.target.value,
            })
          }
          className="mt-1 block w-full bg-stone-800 p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div className="flex flex-col w-1/2">
        <label className="block text-sm font-medium text-white">Capacity</label>
        <input
          type="number"
          value={newTable.capacity}
          onChange={(e) =>
            setNewTable({ ...newTable, capacity: e.target.value })
          }
          className="mt-1 block w-full bg-stone-800 p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
    </div>
    <button
      type="submit"
      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#35605a] transition-all duration-300 ease-in cursor-pointer hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Add Table
    </button>
  </form>
</div>

<h2 className="text-lg font-medium text-[#31E981]  mt-16">All Tables</h2>

      <div className="grid grid-cols-4 gap-6">
        
        {tables?.map((table) => (
          <div
            key={table._id}
            className="bg-black rounded-lg w-fit border-2 border-[#35605a] shadow p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-[#31E981]">
                  Table {table.tableNumber}
                </h3>
                <p className="text-sm text-white">
                  Capacity: {table.capacity}
                </p>
                <p className="text-sm text-white">Status: {table.status}</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 cursor-pointer"
                >
                  Print QR Code
                </button>
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

           {/*  <div className="border-t border-[#31E981] pt-4">
              <div className="flex justify-between items-center font-medium text-lg">
                <span className="text-white">Table QR Code</span>
                <span className="text-white">
                  {table.qrCode || 'Not Available'}
                </span>
              </div> 
            </div>*/}
          </div>
        ))}
      </div>
    </div>
  )
}
