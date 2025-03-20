import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import Menu from '../../../../../lib/models/Menu'
import MenuItem from '../../../../../lib/models/MenuItem'
import dbConnect from '../../../../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const { id, categoryId } = req.query

  await dbConnect()

  // Verify menu belongs to user's restaurant
  const menu = await Menu.findOne({
    _id: id,
    restaurant: session.user.restaurantId,
  })

  if (!menu) {
    return res.status(404).json({ message: 'Menu not found' })
  }

  // Find the category
  const category = menu.categories.id(categoryId)
  if (!category) {
    return res.status(404).json({ message: 'Category not found' })
  }

  switch (req.method) {
    case 'PUT':
      try {
        const { name, description } = req.body

        if (!name) {
          return res.status(400).json({ message: 'Category name is required' })
        }

        // Check if category with same name exists (excluding current category)
        const categoryExists = menu.categories.some(
          (cat) =>
            cat._id.toString() !== categoryId &&
            cat.name.toLowerCase() === name.toLowerCase()
        )

        if (categoryExists) {
          return res
            .status(400)
            .json({ message: 'Category with this name already exists' })
        }

        // Update category
        category.name = name
        category.description = description || category.description

        await menu.save()
        res.status(200).json(category)
      } catch (error) {
        console.error(
          'Error in PUT /api/menu/[id]/categories/[categoryId]:',
          error
        )
        res.status(500).json({ message: 'Error updating category' })
      }
      break

    case 'DELETE':
      try {
        // Find menu items with this category and update categoryId to null or remove
        await MenuItem.updateMany(
          { categoryId: categoryId },
          { $set: { categoryId: null } }
        )

        // Remove category from menu
        menu.categories.pull(categoryId)
        await menu.save()

        res.status(200).json({ message: 'Category deleted successfully' })
      } catch (error) {
        console.error(
          'Error in DELETE /api/menu/[id]/categories/[categoryId]:',
          error
        )
        res.status(500).json({ message: 'Error deleting category' })
      }
      break

    default:
      res.setHeader('Allow', ['PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
