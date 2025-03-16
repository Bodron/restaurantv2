import dbConnect from '../../../lib/db'
import Order from '../../../lib/models/Order'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const { id } = req.query

  await dbConnect()

  if (req.method === 'PATCH') {
    try {
      const { status } = req.body

      if (!status) {
        return res.status(400).json({ message: 'Status is required' })
      }

      // Verify the order exists and belongs to the restaurant
      const order = await Order.findOne({
        _id: id,
        restaurant: session.user.restaurantId,
      })

      if (!order) {
        return res.status(404).json({ message: 'Order not found' })
      }

      // Update the order status
      order.status = status
      await order.save()

      // Return the updated order with populated fields
      const updatedOrder = await Order.findById(id)
        .populate('table')
        .populate('items.menuItem')

      res.status(200).json(updatedOrder)
    } catch (error) {
      console.error('Error in PATCH /api/orders/[id]:', error)
      res.status(500).json({ message: 'Error updating order' })
    }
  } else {
    res.setHeader('Allow', ['PATCH'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
