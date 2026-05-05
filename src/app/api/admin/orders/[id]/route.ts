import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import { requireAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/resend'

const updateSchema = z.object({
  paymentStatus: z.enum(['created', 'pending', 'paid', 'failed', 'refunded']).optional(),
  orderStatus: z.enum(['processing', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  refundId: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
  adminRemarks: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(),
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

    const order = await Order.findById(id)
      .populate({
        path: 'items.productId',
        select: 'title image'
      })
      .lean()
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

    // Get the current order before updating
    const currentOrder = await Order.findById(id)
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Update the order
    const order = await Order.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean()
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Send email notification when order is confirmed
    if (payload.orderStatus === 'confirmed' && currentOrder.orderStatus !== 'confirmed') {
      try {
        console.log('Attempting to send order confirmation email...')
        
        const user = await User.findById(order.userId).select('fullName email').lean()
        console.log('Found user:', user?.email)
        
        if (user?.email) {
          const orderId = order._id.toString().slice(-6)
          console.log('Sending email to:', user.email, 'Order ID:', orderId)
          
          const emailResult = await sendEmail({
            to: user.email,
            subject: `Order Confirmed - #${orderId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #5F613A 0%, #7A7C4F 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your purchase</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h2 style="color: #333; margin-bottom: 15px;">Order Details</h2>
                  <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderId}</p>
                  <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${(order as any).totalAmount?.toFixed(2) || '0.00'}</p>
                  ${payload.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${payload.trackingNumber}</p>` : ''}
                  ${payload.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${new Date(payload.estimatedDelivery).toLocaleDateString()}</p>` : ''}
                </div>
                
                <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="color: #333; margin-bottom: 15px;">Shipping Address</h3>
                  <p style="margin: 5px 0;">${(order as any).shippingAddress?.fullName || ''}</p>
                  <p style="margin: 5px 0;">${(order as any).shippingAddress?.addressLine1 || ''}</p>
                  ${(order as any).shippingAddress?.addressLine2 ? `<p style="margin: 5px 0;">${(order as any).shippingAddress.addressLine2}</p>` : ''}
                  <p style="margin: 5px 0;">${(order as any).shippingAddress?.city || ''}, ${(order as any).shippingAddress?.state || ''} - ${(order as any).shippingAddress?.postalCode || ''}</p>
                  <p style="margin: 5px 0;">${(order as any).shippingAddress?.country || ''}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #666; font-size: 14px;">Thank you for shopping with Anantra Fashion!</p>
                  <p style="color: #666; font-size: 12px; margin-top: 10px;">If you have any questions, please contact our support team.</p>
                </div>
              </div>
            `
          })
          
          console.log('Email send result:', emailResult)
        } else {
          console.log('No user email found')
        }
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError)
        // Don't fail the request if email fails
      }
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
