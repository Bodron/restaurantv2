import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import Restaurant from '../../../lib/models/Restaurant'
import User from '../../../lib/models/User'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { name, address, phone, tables } = req.body

    if (!name || !address || !phone || !tables) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Create restaurant
    const restaurant = new Restaurant({
      name,
      address,
      phone,
      tables,
      owner: session.user.id,
    })

    await restaurant.save()

    // Update user with restaurant reference
    await User.findByIdAndUpdate(session.user.id, {
      restaurantId: restaurant._id,
    })

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        tables: restaurant.tables,
      },
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
