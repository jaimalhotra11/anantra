import { NextRequest, NextResponse } from 'next/server'
import { Types } from 'mongoose'
import { z } from 'zod'
import connectDB from '@/lib/db'
import { auth } from '@/lib/auth'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import Coupon from '@/models/Coupon'
import CouponUsage from '@/models/CouponUsage'
import Order from '@/models/Order'
import User from '@/models/User'
import { createRazorpayOrder } from '@/lib/razorpay'
import { sendEmail } from '@/lib/resend'

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  addressLine1: z.string().min(2),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
})

const payloadSchema = z.object({
  shippingAddress: addressSchema,
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['razorpay', 'cod']).default('razorpay'),
})

interface ProductLite {
  _id: Types.ObjectId
  title: string
  category?: Types.ObjectId
  variants?: Array<{ _id: Types.ObjectId }>
}

function isValidObjectId(id?: string | null) {
  return Boolean(id && /^[0-9a-fA-F]{24}$/.test(id))
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shippingAddress, couponCode, paymentMethod } = payloadSchema.parse(body)

    const cart = await Cart.findOne({ userId: session.user.id }).lean()
    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 })
    }

    const productIds = cart.items.map((item: { productId: string }) => item.productId)
    const products = await Product.find({ _id: { $in: productIds } })
      .select('title category variants')
      .lean()

    const productsMap = new Map(
      (products as ProductLite[]).map((product) => [product._id.toString(), product]),
    )

    const orderItems = cart.items.map((item: { productId: Types.ObjectId; variantId?: Types.ObjectId; quantity: number; priceAtTime: number }) => {
      const product = productsMap.get(item.productId.toString())
      const selectedVariant = product?.variants?.find((variant: { _id: Types.ObjectId }) =>
        item.variantId ? variant._id.toString() === item.variantId.toString() : true,
      )

      return {
        productId: item.productId,
        variantId: item.variantId,
        title: product?.title || 'Product',
        quantity: item.quantity,
        price: item.priceAtTime,
        total: item.priceAtTime * item.quantity,
        meta: selectedVariant,
      }
    })

    const subtotal = orderItems.reduce((sum: number, item: { total: number }) => sum + item.total, 0)

    let coupon = null
    let discount = 0
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() })
      if (!coupon) {
        return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 })
      }

      const now = new Date()
      if (!coupon.isActive || now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json({ success: false, error: 'Coupon is not active' }, { status: 400 })
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ success: false, error: 'Coupon usage limit reached' }, { status: 400 })
      }

      if (coupon.usagePerUser) {
        const usageCount = await CouponUsage.countDocuments({
          couponId: coupon._id,
          userId: session.user.id,
        })
        if (usageCount >= coupon.usagePerUser) {
          return NextResponse.json({ success: false, error: 'Coupon usage exhausted for this user' }, { status: 400 })
        }
      }

      discount = coupon.calculateDiscount(subtotal)
    }

    const shippingCharge = subtotal < 2000 ? 100 : 0
    const codConvenienceFee = paymentMethod === 'cod' ? 25 : 0
    const totalAmount = Math.max(0, subtotal - discount + shippingCharge + codConvenienceFee)

    let razorpayOrder = null
    if (paymentMethod === 'razorpay') {
      razorpayOrder = await createRazorpayOrder({
        amount: Math.round(totalAmount * 100),
        receipt: `order-${Date.now()}`,
      })
    }

    const order = await Order.create({
      userId: session.user.id,
      items: orderItems.map((item: { productId: Types.ObjectId; variantId?: Types.ObjectId; title: string; quantity: number; price: number; total: number }) => ({
        productId: item.productId,
        variantId: item.variantId && isValidObjectId(item.variantId.toString()) ? item.variantId : undefined,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      subtotal,
      discount,
      shippingCharge,
      totalAmount,
      coupon: coupon
        ? {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: discount,
          }
        : undefined,
      shippingAddress,
      razorpayOrderId: razorpayOrder?.orderId || `cod-${Date.now()}`,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'created',
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'processing',
      paymentMethod,
    })

    // Send order confirmation email for all orders
    try {
      const user = await User.findById(session.user.id).select('fullName email').lean()
      if (user?.email) {
        const orderId = order._id.toString().slice(-6)
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #5F613A 0%, #7A7C4F 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Order Placed Successfully!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your purchase</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #333; margin-bottom: 15px;">Order Details</h2>
              <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderId}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
              <p style="margin: 5px 0;"><strong>Order Status:</strong> ${paymentMethod === 'cod' ? 'Confirmed' : 'Processing'}</p>
            </div>
            
            <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Shipping Address</h3>
              <p style="margin: 5px 0;">${shippingAddress.fullName}</p>
              <p style="margin: 5px 0;">${shippingAddress.addressLine1}</p>
              ${shippingAddress.addressLine2 ? `<p style="margin: 5px 0;">${shippingAddress.addressLine2}</p>` : ''}
              <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postalCode}</p>
              <p style="margin: 5px 0;">${shippingAddress.country}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">Thank you for shopping with Anantra Fashion!</p>
              <p style="color: #666; font-size: 12px; margin-top: 10px;">${paymentMethod === 'cod' ? 'You will pay when the order is delivered.' : 'We will process your payment and ship your order soon.'}</p>
            </div>
          </div>
        `
        
        await sendEmail({
          to: user.email,
          subject: `Order Placed - #${orderId}`,
          html: emailHtml,
        })
        
        console.log('Order confirmation email sent to:', user.email)
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
      // Don't fail the order creation if email fails
    }

    // For COD orders, clear the cart immediately
    if (paymentMethod === 'cod') {
      await Cart.findOneAndUpdate(
        { userId: session.user.id },
        { $set: { items: [], totalAmount: 0 } },
      )

      // Handle coupon usage for COD
      if (coupon?.code) {
        coupon.usedCount += 1
        await coupon.save()
        await CouponUsage.create({
          userId: session.user.id,
          couponId: coupon._id,
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id,
          paymentMethod: 'cod',
        },
        message: 'COD order created successfully',
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId: razorpayOrder!.orderId,
        amount: razorpayOrder!.amount,
        currency: razorpayOrder!.currency,
        keyId: razorpayOrder!.keyId,
      },
      message: 'Checkout order created',
    })
  } catch (error: unknown) {
    console.error('Failed to create checkout order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid checkout payload', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to create checkout order' }, { status: 500 })
  }
}
