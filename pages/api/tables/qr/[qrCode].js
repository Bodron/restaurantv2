import dbConnect from '../../../../lib/db'
import Table from '../../../../lib/models/Table'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { qrCode } = req.query

  try {
    await dbConnect()

    const table = await Table.findOne({ qrCode }).populate('restaurant')

    if (!table) {
      return res.status(404).json({ message: 'Table not found' })
    }

    res.status(200).json(table)
  } catch (error) {
    console.error('Error in GET /api/tables/qr/[qrCode]:', error)
    res.status(500).json({ message: 'Error fetching table' })
  }
}
