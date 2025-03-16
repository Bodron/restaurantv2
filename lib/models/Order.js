import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
})

const OrderSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  items: [OrderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending',
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  specialRequests: {
    type: String,
    default: '',
  },
  orderNumber: {
    type: String,
    required: true,
  },
  preparationTime: {
    type: Number, // estimated time in minutes
    default: 15,
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway'],
    default: 'dine-in',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  confirmedAt: {
    type: Date,
    default: null,
  },
  preparedAt: {
    type: Date,
    default: null,
  },
  servedAt: {
    type: Date,
    default: null,
  },
})

// Generate unique order number
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    // Get count of orders for today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0))
    const count = await mongoose.models.Order.countDocuments({
      restaurant: this.restaurant,
      createdAt: { $gte: startOfDay },
    })

    // Format: YYMMDD-RID-XXX where XXX is the sequential number for the day
    this.orderNumber = `${year}${month}${day}-${this.restaurant
      .toString()
      .slice(-3)}-${(count + 1).toString().padStart(3, '0')}`
  }
  next()
})

// Calculate total amount before saving
OrderSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }
  next()
})

export default mongoose.models.Order || mongoose.model('Order', OrderSchema)
