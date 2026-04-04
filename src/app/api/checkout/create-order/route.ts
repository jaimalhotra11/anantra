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
import { createRazorpayOrder } from '@/lib/razorpay'

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
    const { shippingAddress, couponCode } = payloadSchema.parse(body)

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

    const shippingCharge = 0
    const totalAmount = Math.max(0, subtotal - discount + shippingCharge)

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(totalAmount * 100),
      receipt: `order-${Date.now()}`,
    })

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
      razorpayOrderId: razorpayOrder.orderId,
      paymentStatus: 'created',
      orderStatus: 'processing',
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.orderId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayOrder.keyId,
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
