import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
  ],
  order: {
    type: Number,
    default: 0,
  },
})

const MenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  type: {
    type: String,
    enum: ['lunch', 'dinner', 'breakfast', 'weekend', 'special', 'default'],
    default: 'default',
  },
  categories: [CategorySchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  availableFrom: {
    type: Date,
    default: null,
  },
  availableTo: {
    type: Date,
    default: null,
  },
  daysAvailable: [
    {
      type: String,
      enum: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ],
    },
  ],
  timeAvailable: {
    start: {
      type: String, // Format: "HH:mm"
      default: null,
    },
    end: {
      type: String, // Format: "HH:mm"
      default: null,
    },
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

// Ensure menu names are unique within a restaurant
MenuSchema.index({ restaurant: 1, name: 1 }, { unique: true })

// Update the updatedAt timestamp before saving
MenuSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

// Helper method to check if menu is currently available
MenuSchema.methods.isAvailableNow = function () {
  const now = new Date()
  const currentDay = now.toLocaleLowerCase('en-US', { weekday: 'long' })

  // Check if menu is active
  if (!this.isActive) return false

  // Check date range if specified
  if (this.availableFrom && this.availableTo) {
    if (now < this.availableFrom || now > this.availableTo) return false
  }

  // Check if available on current day
  if (this.daysAvailable && this.daysAvailable.length > 0) {
    if (!this.daysAvailable.includes(currentDay)) return false
  }

  // Check time range if specified
  if (this.timeAvailable.start && this.timeAvailable.end) {
    const currentTime = now.toTimeString().slice(0, 5) // "HH:mm"
    if (
      currentTime < this.timeAvailable.start ||
      currentTime > this.timeAvailable.end
    )
      return false
  }

  return true
}

// Helper method to get all available items in the menu
MenuSchema.methods.getAvailableItems = async function () {
  await this.populate({
    path: 'categories.items',
    match: { isAvailable: true },
  })

  return this.categories.reduce((items, category) => {
    return items.concat(category.items)
  }, [])
}

export default mongoose.models.Menu || mongoose.model('Menu', MenuSchema)
