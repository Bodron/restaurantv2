import NextAuth from 'next-auth'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectToDatabase } from '../../../lib/db'
import User from '../../../lib/models/User'

const clientPromise = (async () => {
  const { client } = await connectToDatabase()
  return client
})()

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          throw new Error('Please enter an email and password')
        }

        const user = await User.findOne({ email: credentials.email })

        if (!user) {
          throw new Error('No user found with this email')
        }

        const isValid = await user.comparePassword(credentials.password)

        if (!isValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          restaurantId: user.restaurantId?.toString(),
        }
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.restaurantId = user.restaurantId
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.restaurantId = token.restaurantId
        session.user.id = token.id
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
