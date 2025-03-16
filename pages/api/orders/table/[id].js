import dbConnect from '../../../../lib/db'
import TableSession from '../../../../lib/models/TableSession'
import { getSession } from 'next-auth/react'

export default async function handler(req, res) {
  const session = await getSession({ req })
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

    // Find all sessions for the table, populate orders and their items
    const tableSessions = await TableSession.find({ table: id })
      .populate({
        path: 'orders',
        populate: {
          path: 'items.menuItem',
          model: 'MenuItem',
          select: 'name price',
        },
      })
      .sort({ startTime: -1 }) // Sort by start time, newest first

    console.log('Found sessions:', tableSessions.length)

    // Transform the data to include item details
    const transformedSessions = tableSessions.map((session) => {
      const sessionObj = session.toObject()
      console.log('Session orders:', sessionObj.orders?.length || 0)

      // Transform orders
      sessionObj.orders =
        sessionObj.orders?.map((order) => ({
          _id: order._id,
          status: order.status,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            id: item.menuItem?._id,
            name: item.menuItem?.name,
            price: item.price || item.menuItem?.price,
            quantity: item.quantity,
          })),
        })) || []

      return {
        _id: sessionObj._id,
        status: sessionObj.status,
        startTime: sessionObj.startTime,
        endTime: sessionObj.endTime,
        orders: sessionObj.orders,
      }
    })

    console.log(
      'Transformed sessions:',
      JSON.stringify(transformedSessions, null, 2)
    )
    res.status(200).json(transformedSessions)
  } catch (error) {
    console.error('Error fetching table orders:', error)
    res.status(500).json({ message: 'Error fetching table orders' })
  }
}
