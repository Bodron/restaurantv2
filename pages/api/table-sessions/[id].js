import dbConnect from '../../../lib/db'
import TableSession from '../../../lib/models/TableSession'
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

      if (!status || !['paid', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' })
      }

      // Verify the table session exists and belongs to the restaurant
      const tableSession = await TableSession.findOne({
        _id: id,
        restaurant: session.user.restaurantId,
      })

      if (!tableSession) {
        return res.status(404).json({ message: 'Table session not found' })
      }

      // Update the session status and end time
      tableSession.status = status
      tableSession.endTime = new Date()
      await tableSession.save()

      // Return the updated session with populated fields
      const updatedSession = await TableSession.findById(id)
        .populate('table')
        .populate({
          path: 'orders',
          populate: {
            path: 'items.menuItem',
          },
        })

      res.status(200).json(updatedSession)
    } catch (error) {
      console.error('Error in PATCH /api/table-sessions/[id]:', error)
      res.status(500).json({ message: 'Error updating table session' })
    }
  } else {
    res.setHeader('Allow', ['PATCH'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
