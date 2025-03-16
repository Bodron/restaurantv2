import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import Restaurant from '../../../lib/models/Restaurant'
import User from '../../../lib/models/User'
import dbConnect from '../../../lib/db'

export default async function handler(req, res) {
  await dbConnect()

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  // GET request - fetch restaurant
  if (req.method === 'GET') {
    try {
      const restaurant = await Restaurant.findOne({ owner: session.user.id })
      return res.status(200).json(restaurant || {})
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching restaurant' })
    }
  }

  // POST request - create restaurant
  if (req.method === 'POST') {
    try {
      const { name, description, address, phone, email, openingHours } =
        req.body

      if (!name || !address || !phone || !email) {
        return res.status(400).json({
          message:
            'Please fill in all required fields (name, address, phone, email)',
        })
      }

      // Check if user already has a restaurant
      const existingRestaurant = await Restaurant.findOne({
        owner: session.user.id,
      })
      if (existingRestaurant) {
        return res
          .status(400)
          .json({ message: 'You already have a restaurant' })
      }

      // Create restaurant
      const restaurant = new Restaurant({
        name,
        description,
        address,
        phone,
        email,
        openingHours,
        owner: session.user.id,
      })

      await restaurant.save()

      // Update user with restaurant reference
      await User.findByIdAndUpdate(session.user.id, {
        restaurantId: restaurant._id,
      })

      return res.status(201).json(restaurant)
    } catch (error) {
      return res.status(500).json({ message: error.message })
    }
  }

  // PUT request - update restaurant
  if (req.method === 'PUT') {
    try {
      const { name, description, address, phone, email, openingHours } =
        req.body

      if (!name || !address || !phone || !email) {
        return res.status(400).json({
          message:
            'Please fill in all required fields (name, address, phone, email)',
        })
      }

      const restaurant = await Restaurant.findOneAndUpdate(
        { owner: session.user.id },
        { name, description, address, phone, email, openingHours },
        { new: true, runValidators: true }
      )

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' })
      }

      return res.status(200).json(restaurant)
    } catch (error) {
      return res.status(500).json({ message: error.message })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
