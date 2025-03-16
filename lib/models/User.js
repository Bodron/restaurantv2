import mongoose from 'mongoose'
import { hash, compare } from 'bcryptjs'
import { connectToDatabase } from '../db'

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Add method to check password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return compare(candidatePassword, this.password)
}

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12)
  }
  next()
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

export async function createUser({ email, password, name }) {
  await connectToDatabase()

  try {
    const user = new User({
      email,
      password,
      name,
    })

    await user.save()

    const userObject = user.toObject()
    delete userObject.password

    return userObject
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('User already exists')
    }
    throw error
  }
}

export async function getUserByEmail(email) {
  await connectToDatabase()
  return User.findOne({ email }).exec()
}

export async function getUserById(id) {
  await connectToDatabase()
  return User.findById(id).exec()
}

export async function updateUser(id, updateData) {
  await connectToDatabase()

  const updates = {
    ...updateData,
    updatedAt: new Date(),
  }

  delete updates._id
  delete updates.email
  delete updates.password

  return User.findByIdAndUpdate(id, { $set: updates }, { new: true }).exec()
}

export default User
