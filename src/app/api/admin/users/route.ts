import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import User from '@/models/User'
import { requireAdmin } from '@/lib/admin-auth'

const querySchema = z.object({
  page: z.string().optional().transform((value) => (value ? parseInt(value, 10) : 1)),
  limit: z.string().optional().transform((value) => (value ? parseInt(value, 10) : 10)),
  search: z.string().optional(),
  role: z.enum(['admin', 'user']).optional(),
  isVerified: z.string().optional().transform((value) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  ),
})

export async function GET(request: NextRequest) {
  try {
    const adminError = await requireAdmin()
    if (adminError) return adminError

    await connectDB()

    const { searchParams } = new URL(request.url)
    const { page, limit, search, role, isVerified } = querySchema.parse(
      Object.fromEntries(searchParams),
    )

    const query: Record<string, unknown> = {}
    if (role) query.role = role
    if (typeof isVerified === 'boolean') query.isVerified = isVerified

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('fullName email phone role isVerified createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    })
  } catch (error: unknown) {
    console.error('Failed to fetch admin users:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query params', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}
