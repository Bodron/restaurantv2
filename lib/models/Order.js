import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
  },
  tableSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TableSession',
    required: true,
  },
  items: [
    {
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
      notes: {
        type: String,
        default: '',
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
    default: '',
  },
  total: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt timestamp before saving
OrderSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Order || mongoose.model('Order', OrderSchema)
