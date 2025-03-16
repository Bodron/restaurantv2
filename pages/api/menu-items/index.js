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
        })
        res.status(200).json(menuItems)
      } catch (error) {
        res
          .status(500)
          .json({ message: 'Error fetching menu items', error: error.message })
      }
      break

    case 'POST':
      try {
        const {
          name,
          description,
          price,
          category,
          menuId,
          categoryId,
          image,
          preparationTime,
          allergens,
          nutritionalInfo,
          isSpicy,
          isVegetarian,
          isVegan,
        } = req.body

        if (!name || !price || !menuId || !categoryId) {
          return res.status(400).json({
            message: 'Name, price, menuId, and categoryId are required',
          })
        }

        // Create menu item
        const menuItem = new MenuItem({
          name,
          description,
          price,
          category,
          restaurant: session.user.restaurantId,
          image,
          preparationTime,
          allergens,
          nutritionalInfo,
          isSpicy,
          isVegetarian,
          isVegan,
        })

        await menuItem.save()

        // Add item to menu category
        await Menu.findOneAndUpdate(
          {
            _id: menuId,
            'categories._id': categoryId,
            restaurant: session.user.restaurantId,
          },
          {
            $push: {
              'categories.$.items': menuItem._id,
            },
          }
        )

        res.status(201).json(menuItem)
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({
            message:
              'Menu item with this name already exists in this restaurant',
          })
        }
        res.status(500).json({
          message: 'Error creating menu item',
          error: error.message,
        })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
