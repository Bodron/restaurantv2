import mongoose from 'mongoose'

const TableSessionSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['active', 'paid', 'cancelled'],
    default: 'active',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  ],
})

export default mongoose.models.TableSession ||
  mongoose.model('TableSession', TableSessionSchema)
