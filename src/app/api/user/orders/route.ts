import { NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Order from '@/models/Order'
import { auth } from '@/lib/auth'

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

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .select('items subtotal discount tax shippingCharge totalAmount coupon paymentStatus orderStatus createdAt updatedAt')
      .lean()

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('Failed to fetch user orders:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
  }
}
