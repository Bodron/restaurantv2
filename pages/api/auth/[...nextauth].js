import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import dbConnect from '../../../lib/db'
import User from '../../../lib/models/User'
import Restaurant from '../../../lib/models/Restaurant'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          await dbConnect()

          // Ensure Restaurant model is registered
          if (!mongoose.models.Restaurant) {
            mongoose.model('Restaurant', Restaurant.schema)
          }

          const user = await User.findOne({
            email: credentials.email,
          }).populate('restaurantId')

          if (!user) {
            throw new Error('No user found')
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isValid) {
            throw new Error('Invalid password')
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            restaurantId: user.restaurantId
              ? user.restaurantId._id.toString()
              : null,
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw new Error(error.message)
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.restaurantId = user.restaurantId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.restaurantId = token.restaurantId
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
