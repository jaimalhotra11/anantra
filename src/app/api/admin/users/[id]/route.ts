import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import User from '@/models/User'
import { requireAdmin } from '@/lib/admin-auth'

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  role: z.enum(['admin', 'user']).optional(),
  isVerified: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminError = await requireAdmin()
    if (adminError) return adminError

    await connectDB()
    const { id } = await params

    const user = await User.findById(id)
      .select('fullName email phone avatar role isVerified createdAt updatedAt')
      .lean()

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminError = await requireAdmin()
    if (adminError) return adminError

    await connectDB()
    const { id } = await params

    const body = await request.json()
    const payload = updateSchema.parse(body)

    const user = await User.findByIdAndUpdate(id, { $set: payload }, { new: true })
      .select('fullName email phone avatar role isVerified createdAt updatedAt')
      .lean()

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user, message: 'User updated successfully' })
  } catch (error: unknown) {
    console.error('Failed to update user:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid user payload', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}
