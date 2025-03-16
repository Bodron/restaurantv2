import dbConnect from '../../../lib/db'
import Order from '../../../lib/models/Order'
import Table from '../../../lib/models/Table'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  await dbConnect()

  switch (req.method) {
    case 'GET':
      try {
        const orders = await Order.find({
          restaurant: session.user.restaurantId,
        })
          .populate('table')
          .populate('items.menuItem')
          .sort({ createdAt: -1 })
        res.status(200).json(orders)
      } catch (error) {
        console.error('Error in GET /api/orders:', error)
        res.status(500).json({ message: 'Error fetching orders' })
      }
      break

    case 'POST':
      try {
        const { tableId, items, notes } = req.body

        // Validate required fields
        if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: 'Invalid order data' })
        }

        // Get table to verify it exists and get restaurant ID
        const table = await Table.findById(tableId)
        if (!table) {
          return res.status(404).json({ message: 'Table not found' })
        }

        // Create order
        const order = await Order.create({
          table: tableId,
          restaurant: table.restaurant,
          items: items.map((item) => ({
            menuItem: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
          })),
          status: 'pending',
          notes,
        })

        // Populate the response with table and menu item details
        const populatedOrder = await Order.findById(order._id)
          .populate('table')
          .populate('items.menuItem')

        res.status(201).json(populatedOrder)
      } catch (error) {
        console.error('Error in POST /api/orders:', error)
        res.status(500).json({ message: 'Error creating order' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
