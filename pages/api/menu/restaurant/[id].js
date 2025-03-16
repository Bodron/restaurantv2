import dbConnect from '../../../../lib/db'
import Menu from '../../../../lib/models/Menu'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query // restaurant id

  try {
    await dbConnect()

    const menu = await Menu.findOne({
      restaurant: id,
      isActive: true,
    })

    if (!menu) {
      return res.status(404).json({ message: 'No active menu found' })
    }

    res.status(200).json(menu)
  } catch (error) {
    console.error('Error in GET /api/menu/restaurant/[id]:', error)
    res.status(500).json({ message: 'Error fetching menu' })
  }
}
