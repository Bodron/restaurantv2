import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import Menu from '../../../lib/models/Menu'
import dbConnect from '../../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const { id } = req.query

  await dbConnect()

  // Verify menu belongs to user's restaurant
  const menu = await Menu.findOne({
    _id: id,
    restaurant: session.user.restaurantId,
  })

  if (!menu) {
    return res.status(404).json({ message: 'Menu not found' })
  }

  switch (req.method) {
    case 'GET':
      try {
        const populatedMenu = await menu.populate({
          path: 'categories.items',
          model: 'MenuItem',
          select: '-createdAt -updatedAt',
        })
        res.status(200).json(populatedMenu)
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Error fetching menu', error: error.message })
      }
      break

    case 'PUT':
      try {
        const {
          name,
          type,
          categories,
          isActive,
          availableFrom,
          availableTo,
          daysAvailable,
          timeAvailable,
        } = req.body

        menu.name = name || menu.name
        menu.type = type || menu.type
        menu.categories = categories || menu.categories
        menu.isActive = isActive !== undefined ? isActive : menu.isActive
        menu.availableFrom = availableFrom || menu.availableFrom
        menu.availableTo = availableTo || menu.availableTo
        menu.daysAvailable = daysAvailable || menu.daysAvailable
        menu.timeAvailable = timeAvailable || menu.timeAvailable

        await menu.save()
        res.status(200).json(menu)
      } catch (error) {
        if (error.code === 11000) {
          return res
            .status(400)
            .json({ message: 'Menu with this name already exists' })
        }
        res
          .status(500)
          .json({ message: 'Error updating menu', error: error.message })
      }
      break

    case 'DELETE':
      try {
        await menu.deleteOne()
        res.status(200).json({ message: 'Menu deleted successfully' })
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Error deleting menu', error: error.message })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
