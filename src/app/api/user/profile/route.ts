import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/models/User'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  avatar: z.string().url().optional(),
})

async function getCurrentUserId() {
  const session = await auth()
  return session?.user?.id || null
}

export async function GET() {
  try {
    await connectDB()
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(userId)
      .select('fullName email phone avatar role isVerified createdAt updatedAt')
      .lean()

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const payload = profileUpdateSchema.parse(body)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: payload },
      { new: true },
    )
      .select('fullName email phone avatar role isVerified createdAt updatedAt')
      .lean()

    return NextResponse.json({ success: true, data: updatedUser, message: 'Profile updated' })
  } catch (error: unknown) {
    console.error('Failed to update profile:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid profile payload', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
  }
}
