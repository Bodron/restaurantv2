import mongoose from 'mongoose'

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  image: {
    type: String,
    default: null,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15,
  },
  allergens: [
    {
      type: String,
    },
  ],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbohydrates: Number,
    fats: Number,
  },
  isSpicy: {
    type: Boolean,
    default: false,
  },
  isVegetarian: {
    type: Boolean,
    default: false,
  },
  isVegan: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Ensure menu item names are unique within a restaurant
MenuItemSchema.index({ restaurant: 1, name: 1 }, { unique: true })

export default mongoose.models.MenuItem ||
  mongoose.model('MenuItem', MenuItemSchema)
