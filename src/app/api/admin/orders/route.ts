import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import { requireAdmin } from '@/lib/admin-auth'

const querySchema = z.object({
  page: z.string().optional().transform((value) => (value ? parseInt(value, 10) : 1)),
  limit: z.string().optional().transform((value) => (value ? parseInt(value, 10) : 10)),
  search: z.string().optional(),
  paymentStatus: z.enum(['created', 'pending', 'paid', 'failed', 'refunded']).optional(),
  orderStatus: z.enum(['processing', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const adminError = await requireAdmin()
    if (adminError) return adminError

    await connectDB()

    const { searchParams } = new URL(request.url)
    const { page, limit, search, paymentStatus, orderStatus } = querySchema.parse(
      Object.fromEntries(searchParams),
    )

    const query: Record<string, unknown> = {}
    if (paymentStatus) query.paymentStatus = paymentStatus
    if (orderStatus) query.orderStatus = orderStatus

    if (search) {
      query.$or = [
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ])

    const userIds = orders.map((order: { userId: { toString: () => string } }) => order.userId.toString())
    const users = await User.find({ _id: { $in: userIds } })
      .select('fullName email')
      .lean()

    const userMap = new Map(
      users.map((user: { _id: { toString: () => string } }) => [user._id.toString(), user]),
    )

    const data = orders.map((order: { userId: { toString: () => string } }) => ({
      ...order,
      user: userMap.get(order.userId.toString()) || null,
    }))

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    })
  } catch (error: unknown) {
    console.error('Failed to fetch admin orders:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query params', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
  }
}
