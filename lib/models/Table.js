import mongoose from 'mongoose'

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  qrCode: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available',
  },
  capacity: {
    type: Number,
    required: true,
    default: 4,
  },
  currentSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Middleware to ensure tableNumber is unique within a restaurant
TableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true })

export default mongoose.models.Table || mongoose.model('Table', TableSchema)
