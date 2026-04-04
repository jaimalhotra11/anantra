import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import Coupon from '@/models/Coupon'
import CouponUsage from '@/models/CouponUsage'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
  productIds: z.array(z.string()).default([]),
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, subtotal, productIds } = schema.parse(body)

    const coupon = await Coupon.findOne({ code: code.toUpperCase() })
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

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order amount should be ₹${coupon.minOrderAmount}`,
        },
        { status: 400 },
      )
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

    const hasProductRestrictions = Array.isArray(coupon.applicableProductIds) && coupon.applicableProductIds.length > 0
    const hasCategoryRestrictions = Array.isArray(coupon.applicableCategoryIds) && coupon.applicableCategoryIds.length > 0

    if ((hasProductRestrictions || hasCategoryRestrictions) && productIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Coupon is not applicable for this cart' }, { status: 400 })
    }

    if (hasProductRestrictions || hasCategoryRestrictions) {
      const products = await Product.find({ _id: { $in: productIds } }).select('category').lean()
      const productIdSet = new Set(productIds)
      const categoryIdSet = new Set(
        products.map((product: { category?: string }) => String(product.category || '')).filter(Boolean),
      )

      const allowedProducts = new Set(
        (coupon.applicableProductIds || []).map((id: { toString: () => string }) => id.toString()),
      )
      const allowedCategories = new Set(
        (coupon.applicableCategoryIds || []).map((id: { toString: () => string }) => id.toString()),
      )

      const validByProduct = [...productIdSet].some((id) => allowedProducts.has(id))
      const validByCategory = [...categoryIdSet].some((id) => allowedCategories.has(id))

      if (!validByProduct && !validByCategory) {
        return NextResponse.json({ success: false, error: 'Coupon is not applicable for this cart' }, { status: 400 })
      }
    }

    const discount = coupon.calculateDiscount(subtotal)

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      message: 'Coupon applied successfully',
    })
  } catch (error: unknown) {
    console.error('Failed to validate coupon:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon payload', details: error.errors },
        { status: 400 },
      )
    }
    return NextResponse.json({ success: false, error: 'Failed to validate coupon' }, { status: 500 })
  }
}
