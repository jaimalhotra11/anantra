import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import { auth } from '@/lib/auth'
import Order from '@/models/Order'
import User from '@/models/User'
import Coupon from '@/models/Coupon'
import CouponUsage from '@/models/CouponUsage'
import Cart from '@/models/Cart'
import { sendEmail } from '@/lib/resend'

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

    // Send order confirmation email when payment is successfully completed
    try {
      const user = await User.findById(session.user.id).select('fullName email').lean()
      if (user?.email) {
        const orderId = order._id.toString().slice(-6)
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #5F613A 0%, #7A7C4F 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Payment Confirmed!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your payment</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #333; margin-bottom: 15px;">Order Details</h2>
              <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderId}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${(order.totalAmount || 0).toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> Online Payment</p>
              <p style="margin: 5px 0;"><strong>Order Status:</strong> Confirmed</p>
            </div>
            
            <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Shipping Address</h3>
              <p style="margin: 5px 0;">${(order.shippingAddress as any)?.fullName || ''}</p>
              <p style="margin: 5px 0;">${(order.shippingAddress as any)?.addressLine1 || ''}</p>
              ${(order.shippingAddress as any)?.addressLine2 ? `<p style="margin: 5px 0;">${(order.shippingAddress as any).addressLine2}</p>` : ''}
              <p style="margin: 5px 0;">${(order.shippingAddress as any)?.city || ''}, ${(order.shippingAddress as any)?.state || ''} - ${(order.shippingAddress as any)?.postalCode || ''}</p>
              <p style="margin: 5px 0;">${(order.shippingAddress as any)?.country || ''}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">Thank you for shopping with Anantra Fashion!</p>
              <p style="color: #666; font-size: 12px; margin-top: 10px;">Your order has been confirmed and will be processed soon.</p>
            </div>
          </div>
        `
        
        await sendEmail({
          to: user.email,
          subject: `Payment Confirmed - Order #${orderId}`,
          html: emailHtml,
        })
        
        console.log('Payment confirmation email sent to:', user.email)
      }
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError)
      // Don't fail the request if email fails
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
