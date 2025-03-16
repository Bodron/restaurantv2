import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import Menu from '../../../../lib/models/Menu'
import dbConnect from '../../../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const { id } = req.query // menu id

  await dbConnect()

  switch (req.method) {
    case 'POST':
      try {
        const { name, description } = req.body

        if (!name) {
          return res.status(400).json({ message: 'Category name is required' })
        }

        const menu = await Menu.findById(id)
        if (!menu) {
          return res.status(404).json({ message: 'Menu not found' })
        }

        // Check if category with same name exists
        const categoryExists = menu.categories.some(
          (category) => category.name.toLowerCase() === name.toLowerCase()
        )

        if (categoryExists) {
          return res
            .status(400)
            .json({ message: 'Category with this name already exists' })
        }

        const newCategory = {
          name,
          description,
          items: [],
        }

        menu.categories.push(newCategory)
        await menu.save()

        res.status(201).json(menu.categories[menu.categories.length - 1])
      } catch (error) {
        console.error('Error in POST /api/menu/[id]/categories:', error)
        res.status(500).json({ message: 'Error creating category' })
      }
      break

    case 'GET':
      try {
        const menu = await Menu.findById(id)
        if (!menu) {
          return res.status(404).json({ message: 'Menu not found' })
        }
        res.status(200).json(menu.categories)
      } catch (error) {
        console.error('Error in GET /api/menu/[id]/categories:', error)
        res.status(500).json({ message: 'Error fetching categories' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
