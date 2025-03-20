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

  const { id } = req.query

  await dbConnect()

  // Verify menu item belongs to user's restaurant
  const menuItem = await MenuItem.findOne({
    _id: id,
    restaurant: session.user.restaurantId,
  })

  if (!menuItem) {
    return res.status(404).json({ message: 'Menu item not found' })
  }

  switch (req.method) {
    case 'GET':
      res.status(200).json(menuItem)
      break

    case 'PUT':
      try {
        const {
          name,
          description,
          price,
          menuId,
          categoryId,
          image,
          isAvailable,
          preparationTime,
          allergens,
          nutritionalInfo,
          isSpicy,
          isVegetarian,
          isVegan,
        } = req.body

        // Verify that the menu exists and belongs to the restaurant if menu or category is updated
        if (menuId && categoryId) {
          const menu = await Menu.findOne({
            _id: menuId,
            'categories._id': categoryId,
            restaurant: session.user.restaurantId,
          })

          if (!menu) {
            return res
              .status(404)
              .json({ message: 'Menu or category not found' })
          }
        }

        // Update fields if provided
        if (name) menuItem.name = name
        if (description !== undefined) menuItem.description = description
        if (price) menuItem.price = price
        if (menuId) menuItem.menuId = menuId
        if (categoryId) menuItem.categoryId = categoryId
        if (image !== undefined) menuItem.image = image
        if (isAvailable !== undefined) menuItem.isAvailable = isAvailable
        if (preparationTime) menuItem.preparationTime = preparationTime
        if (allergens) menuItem.allergens = allergens
        if (nutritionalInfo) menuItem.nutritionalInfo = nutritionalInfo
        if (isSpicy !== undefined) menuItem.isSpicy = isSpicy
        if (isVegetarian !== undefined) menuItem.isVegetarian = isVegetarian
        if (isVegan !== undefined) menuItem.isVegan = isVegan

        await menuItem.save()
        res.status(200).json(menuItem)
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({
            message:
              'Menu item with this name already exists in this restaurant',
          })
        }
        res.status(500).json({
          message: 'Error updating menu item',
          error: error.message,
        })
      }
      break

    case 'DELETE':
      try {
        // Remove item from all menus
        await Menu.updateMany(
          { restaurant: session.user.restaurantId },
          { $pull: { 'categories.$[].items': menuItem._id } }
        )

        // Delete the menu item
        await menuItem.deleteOne()

        res.status(200).json({ message: 'Menu item deleted successfully' })
      } catch (error) {
        res.status(500).json({
          message: 'Error deleting menu item',
          error: error.message,
        })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
