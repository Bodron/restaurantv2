import dbConnect from '../../../lib/db'
import Order from '../../../lib/models/Order'
import Table from '../../../lib/models/Table'
import TableSession from '../../../lib/models/TableSession'
import MenuItem from '../../../lib/models/MenuItem'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  await dbConnect()

  switch (req.method) {
    case 'GET':
      // Pentru GET avem nevoie de autentificare (pentru dashboard-ul administratorului)
      const getSession = await getServerSession(req, res, authOptions)
      if (!getSession) {
        return res.status(401).json({ message: 'Not authenticated' })
      }

      try {
        const orders = await Order.find({
          restaurant: getSession.user.restaurantId,
        })
          .populate('table')
          .populate('items.menuItem')
          .populate('tableSession')
          .sort({ createdAt: -1 })
        res.status(200).json(orders)
      } catch (error) {
        console.error('Error in GET /api/orders:', error)
        res.status(500).json({ message: 'Error fetching orders' })
      }
      break

    case 'POST':
      try {
        const { tableId, items, notes } = req.body

        // Validate required fields
        if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: 'Invalid order data' })
        }

        // Get table to verify it exists and get restaurant ID
        const table = await Table.findById(tableId)
        if (!table) {
          return res.status(404).json({ message: 'Table not found' })
        }

        // Verifică dacă este o comandă cu QR code și dacă masa este activă (are un cod QR valid)
        if (!table.qrCode) {
          // Dacă masa nu are QR code, înseamnă că comandă vine din dashboard
          // și necesită autentificare
          const postSession = await getServerSession(req, res, authOptions)
          if (!postSession) {
            return res.status(401).json({ message: 'Not authenticated' })
          }

          // Verifică dacă utilizatorul autentificat aparține restaurantului mesei
          if (postSession.user.restaurantId !== table.restaurant.toString()) {
            return res
              .status(403)
              .json({ message: 'Not authorized for this restaurant' })
          }
        }

        // Get or create active table session
        let tableSession = await TableSession.findOne({
          table: tableId,
          status: 'active',
        })

        if (!tableSession) {
          tableSession = await TableSession.create({
            table: tableId,
            restaurant: table.restaurant,
            status: 'active',
          })
        }

        // Get menu items to calculate total
        const menuItemIds = items.map((item) => item.menuItemId)
        const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } })
        const menuItemsMap = menuItems.reduce((map, item) => {
          map[item._id.toString()] = item
          return map
        }, {})

        // Calculate total and prepare items with prices
        const orderItems = items.map((item) => {
          const menuItem = menuItemsMap[item.menuItemId]
          return {
            menuItem: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
            price: menuItem.price,
          }
        })

        const total = orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )

        // Create order - pentru guest adăugăm un flag isGuestOrder
        const order = await Order.create({
          table: tableId,
          restaurant: table.restaurant,
          tableSession: tableSession._id,
          items: orderItems,
          status: 'pending',
          notes,
          total,
          isGuestOrder: !req.body.userId, // Marcăm comanda ca fiind de la un guest dacă nu avem userId
        })

        // Update table session
        tableSession.orders.push(order._id)
        tableSession.totalAmount += total
        await tableSession.save()

        // Populate the response with table and menu item details
        const populatedOrder = await Order.findById(order._id)
          .populate('table')
          .populate('items.menuItem')
          .populate('tableSession')

        res.status(201).json(populatedOrder)
      } catch (error) {
        console.error('Error in POST /api/orders:', error)
        res.status(500).json({ message: 'Error creating order' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
