import dbConnect from '../../../../lib/db'
import TableSession from '../../../../lib/models/TableSession'
import Order from '../../../../lib/models/Order'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const { id } = req.query
  console.log('Fetching orders for table:', id)

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await dbConnect()

    // Check if table exists (this step helps with debugging)
    console.log('Looking for sessions with table ID:', id)

    // Try a direct approach first - find all orders for this table
    const orders = await Order.find({ table: id })
      .populate('tableSession')
      .populate({
        path: 'items.menuItem',
        select: 'name price image isVegan isVegetarian isSpicy',
      })
      .sort({ createdAt: -1 })

    console.log(`Found ${orders.length} orders directly for table ${id}`)

    // Group orders by tableSession
    const sessionMap = {}

    orders.forEach((order) => {
      const sessionId = order.tableSession?._id?.toString()
      if (!sessionId) return

      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = {
          _id: sessionId,
          status: order.tableSession.status || 'unknown',
          startTime: order.tableSession.startTime || order.createdAt,
          endTime: order.tableSession.endTime,
          orders: [],
        }
      }

      // Transform order
      sessionMap[sessionId].orders.push({
        _id: order._id,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.menuItem?._id,
          name: item.menuItem?.name,
          price: item.price || item.menuItem?.price,
          quantity: item.quantity,
          image: item.menuItem?.image,
          isVegan: item.menuItem?.isVegan,
          isVegetarian: item.menuItem?.isVegetarian,
          isSpicy: item.menuItem?.isSpicy,
        })),
      })
    })

    // Convert the session map to an array
    const transformedSessions = Object.values(sessionMap)

    console.log(
      'Response contains',
      transformedSessions.length,
      'sessions with',
      transformedSessions.reduce(
        (sum, session) => sum + (session.orders?.length || 0),
        0
      ),
      'total orders'
    )

    // Sort the sessions by start time, newest first
    transformedSessions.sort(
      (a, b) => new Date(b.startTime) - new Date(a.startTime)
    )

    res.status(200).json(transformedSessions)
  } catch (error) {
    console.error('Error fetching table orders:', error)
    res
      .status(500)
      .json({ message: `Error fetching table orders: ${error.message}` })
  }
}
