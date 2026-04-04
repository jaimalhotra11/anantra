import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import connectDB from "@/lib/db"
import UserModel from "@/models/User"
import bcryptjs from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [ 
    Credentials({
      credentials: {
        email: {type: "email"},
        password: {type: "password"}
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Connect to database
          await connectDB()

          // Find user by email
          const user = await UserModel.findOne({ email: credentials.email }).select('+password')

          if (!user) {
            return null
          }

          // Check if user is verified
          if (!user.isVerified) {
            throw new Error("Please verify your email before logging in")
          }

          // Verify password
          const isPasswordValid = await bcryptjs.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Return user object for session
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            isVerified: user.isVerified
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
   ],
   session: {
    strategy: "jwt"
   },
   callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.isVerified = user.isVerified
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.isVerified = token.isVerified as boolean
      }
      return session
    }
   }
})
