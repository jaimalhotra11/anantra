import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Coupon from '@/models/Coupon'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Coupon update schema
const couponUpdateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(20, 'Coupon code must be less than 20 characters').toUpperCase().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0, 'Discount value must be positive').optional(),
  minOrderAmount: z.number().min(0, 'Minimum order amount must be positive').optional(),
  maxDiscountAmount: z.number().min(0, 'Maximum discount amount must be positive').optional(),
  usageLimit: z.number().min(1, 'Usage limit must be at least 1').optional(),
  usagePerUser: z.number().min(1, 'Usage per user must be at least 1').optional(),
  validFrom: z.string().transform(val => new Date(val)).optional(),
  validUntil: z.string().transform(val => new Date(val)).optional(),
  isActive: z.boolean().optional(),
  applicableProductIds: z.array(z.string()).optional(),
  applicableCategoryIds: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.validFrom && data.validUntil) {
    return data.validUntil > data.validFrom
  }
  return true
}, {
  message: 'Valid until date must be after valid from date',
  path: ['validUntil'],
})

// GET /api/coupons/[id] - Fetch a specific coupon by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      )
    }

    const coupon = await Coupon.findById(id)
      .populate('applicableProductIds', 'title slug')
      .populate('applicableCategoryIds', 'name slug')
      .lean()

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    })
  } catch (error) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupon' },
      { status: 500 }
    )
  }
}

// PUT /api/coupons/[id] - Update a specific coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = couponUpdateSchema.parse(body)

    // Check if coupon exists
    const existingCoupon = await Coupon.findById(id)
    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Check if coupon code already exists (if updating code)
    if (validatedData.code && validatedData.code !== existingCoupon.code) {
      const duplicateCoupon = await Coupon.findOne({ code: validatedData.code })
      if (duplicateCoupon) {
        return NextResponse.json(
          { success: false, error: 'Coupon code already exists' },
          { status: 409 }
        )
      }
    }

    // Update the coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
      .populate('applicableProductIds', 'title slug')
      .populate('applicableCategoryIds', 'name slug')
      .lean()

    return NextResponse.json({
      success: true,
      data: updatedCoupon,
      message: 'Coupon updated successfully',
    })
  } catch (error) {
    console.error('Error updating coupon:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

// DELETE /api/coupons/[id] - Delete a specific coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      )
    }

    // Check if coupon exists
    const existingCoupon = await Coupon.findById(id)
    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Delete the coupon
    await Coupon.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
