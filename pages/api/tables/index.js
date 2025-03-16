import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import Table from '../../../lib/models/Table'
import dbConnect from '../../../lib/db'
import crypto from 'crypto'

// Function to generate a unique QR code identifier
const generateQRIdentifier = () => {
  return crypto.randomBytes(8).toString('hex')
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  console.log('Session:', session)

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const restaurantId = session.user.restaurantId
  if (!restaurantId) {
    return res.status(400).json({ message: 'Please create a restaurant first' })
  }

  try {
    await dbConnect()
  } catch (error) {
    console.error('Database connection error:', error)
    return res.status(500).json({ message: 'Database connection failed' })
  }

  switch (req.method) {
    case 'GET':
      try {
        console.log('Fetching tables for restaurant:', restaurantId)
        const tables = await Table.find({
          restaurant: restaurantId,
        }).sort({ tableNumber: 1 })
        console.log('Found tables:', tables)
        res.status(200).json(tables)
      } catch (error) {
        console.error('Error in GET /api/tables:', error)
        res.status(500).json({ message: 'Error fetching tables' })
      }
      break

    case 'POST':
      try {
        const { tableNumber, capacity } = req.body

        if (!tableNumber) {
          return res.status(400).json({ message: 'Table number is required' })
        }

        // Check if table number already exists for this restaurant
        const existingTable = await Table.findOne({
          restaurant: restaurantId,
          tableNumber: tableNumber,
        })

        if (existingTable) {
          return res
            .status(400)
            .json({ message: 'Table number already exists in this restaurant' })
        }

        // Generate QR code identifier
        const qrIdentifier = generateQRIdentifier()

        const table = new Table({
          tableNumber,
          capacity: capacity || 4,
          restaurant: restaurantId,
          qrCode: qrIdentifier,
          status: 'available',
        })

        await table.save()

        // Return the table with the full QR code URL
        res.status(201).json({
          ...table.toObject(),
          qrCode: `${process.env.NEXTAUTH_URL}/menu/${qrIdentifier}`,
        })
      } catch (error) {
        console.error('Error in POST /api/tables:', error)
        res.status(500).json({ message: 'Error creating table' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
