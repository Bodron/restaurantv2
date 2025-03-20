import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import MenuItem from '../../../lib/models/MenuItem'
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
        const menuItems = await MenuItem.find({
          restaurant: session.user.restaurantId,
        }).populate('menuId')
        res.status(200).json(menuItems)
      } catch (error) {
        console.error('Error in GET /api/menu-items:', error)
        res.status(500).json({ message: 'Error fetching menu items' })
      }
      break

    case 'POST':
      try {
        const { name, description, price, menuId, categoryId, image } = req.body

        if (!name || !price || !menuId || !categoryId) {
          return res.status(400).json({
            message: 'Name, price, menuId, and categoryId are required',
          })
        }

        // Verify that the menu exists and belongs to the restaurant
        const menu = await Menu.findOne({
          _id: menuId,
          'categories._id': categoryId,
        })

        if (!menu) {
          return res.status(404).json({ message: 'Menu or category not found' })
        }

        // Check if menu item with same name exists in this restaurant
        const existingItem = await MenuItem.findOne({
          restaurant: session.user.restaurantId,
          name: name,
        })

        if (existingItem) {
          return res
            .status(400)
            .json({ message: 'Menu item with this name already exists' })
        }

        const menuItem = new MenuItem({
          name,
          description,
          price,
          menuId,
          categoryId,
          restaurant: session.user.restaurantId,
          image,
        })

        await menuItem.save()
        res.status(201).json(menuItem)
      } catch (error) {
        console.error('Error in POST /api/menu-items:', error)
        res.status(500).json({ message: 'Error creating menu item' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
