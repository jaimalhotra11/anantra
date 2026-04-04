import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import { requireAdmin } from '@/lib/admin-auth'

const updateSchema = z.object({
  paymentStatus: z.enum(['created', 'pending', 'paid', 'failed', 'refunded']).optional(),
  orderStatus: z.enum(['processing', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  refundId: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
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

    const order = await Order.findById(id).lean()
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const user = await User.findById(order.userId).select('fullName email phone').lean()

    return NextResponse.json({ success: true, data: { ...order, user } })
  } catch (error) {
    console.error('Failed to fetch order details:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch order details' }, { status: 500 })
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

    const order = await Order.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean()
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: order, message: 'Order updated successfully' })
  } catch (error: unknown) {
    console.error('Failed to update order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
  }
}
