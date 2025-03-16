import mongoose from 'mongoose'

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name for your restaurant'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide an address'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    openingHours: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tables: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

// Add indexes
restaurantSchema.index({ owner: 1 }, { unique: true })
restaurantSchema.index({ name: 1 })

export default mongoose.models.Restaurant ||
  mongoose.model('Restaurant', restaurantSchema)
