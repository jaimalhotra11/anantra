import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import { auth } from '@/lib/auth'
import Order from '@/models/Order'
import Coupon from '@/models/Coupon'
import CouponUsage from '@/models/CouponUsage'
import Cart from '@/models/Cart'

const schema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = schema.parse(body)

    const order = await Order.findOne({ _id: orderId, userId: session.user.id })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ success: true, message: 'Payment already verified' })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json({ success: false, error: 'Razorpay key secret is missing' }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      order.paymentStatus = 'failed'
      order.razorpayPaymentId = razorpayPaymentId
      order.razorpaySignature = razorpaySignature
      await order.save()
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    order.paymentStatus = 'paid'
    order.orderStatus = 'confirmed'
    order.razorpayPaymentId = razorpayPaymentId
    order.razorpaySignature = razorpaySignature
    await order.save()

    if (order.coupon?.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code })
      if (coupon) {
        coupon.usedCount += 1
        await coupon.save()

        await CouponUsage.create({
          couponId: coupon._id,
          userId: session.user.id,
          orderId: order._id,
          usedAt: new Date(),
        })
      }
    }

    await Cart.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { items: [], totalAmount: 0 } },
    )

    return NextResponse.json({ success: true, message: 'Payment verified and order confirmed' })
  } catch (error: unknown) {
    console.error('Failed to verify payment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment payload', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 })
  }
}
