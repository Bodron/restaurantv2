import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import Menu from '../../../lib/models/Menu'
import dbConnect from '../../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  await dbConnect()

  switch (req.method) {
    case 'GET':
      try {
        const menus = await Menu.find({
          restaurant: session.user.restaurantId,
        }).populate({
          path: 'categories.items',
          model: 'MenuItem',
          select: '-createdAt -updatedAt',
        })
        res.status(200).json(menus)
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Error fetching menus', error: error.message })
      }
      break

    case 'POST':
      try {
        const { name, type, categories } = req.body

        if (!name) {
          return res.status(400).json({ message: 'Menu name is required' })
        }

        const menu = new Menu({
          name,
          type,
          categories: categories || [],
          restaurant: session.user.restaurantId,
        })

        await menu.save()
        res.status(201).json(menu)
      } catch (error) {
        if (error.code === 11000) {
          return res
            .status(400)
            .json({ message: 'Menu with this name already exists' })
        }
        res
          .status(500)
          .json({ message: 'Error creating menu', error: error.message })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
