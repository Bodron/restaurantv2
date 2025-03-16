import dbConnect from '../../../../lib/db'
import MenuItem from '../../../../lib/models/MenuItem'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query // restaurant id

  try {
    await dbConnect()

    const menuItems = await MenuItem.find({
      restaurant: id,
      isAvailable: true,
    }).sort({ name: 1 })

    res.status(200).json(menuItems)
  } catch (error) {
    console.error('Error in GET /api/menu-items/restaurant/[id]:', error)
    res.status(500).json({ message: 'Error fetching menu items' })
  }
}
