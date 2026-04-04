import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Coupon from '@/models/Coupon'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Bulk operations schema
const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'activate', 'deactivate']),
  couponIds: z.array(z.string()).min(1, 'At least one coupon ID is required'),
})

// POST /api/coupons/bulk - Perform bulk operations on coupons
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication for bulk operations
    const authError = await requireAdmin()
    if (authError) {
      return authError
    }

    await connectDB()

    const body = await request.json()
    const validatedData = bulkOperationSchema.parse(body)

    const { action, couponIds } = validatedData

    // Validate that all coupon IDs exist
    const existingCoupons = await Coupon.find({ _id: { $in: couponIds } })
    if (existingCoupons.length !== couponIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more coupons not found' },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case 'delete':
        result = await Coupon.deleteMany({ _id: { $in: couponIds } })
        return NextResponse.json({
          success: true,
          message: `Successfully deleted ${result.deletedCount} coupons`,
          data: { deletedCount: result.deletedCount },
        })

      case 'activate':
        result = await Coupon.updateMany(
          { _id: { $in: couponIds } },
          { $set: { isActive: true, updatedAt: new Date() } }
        )
        return NextResponse.json({
          success: true,
          message: `Successfully activated ${result.modifiedCount} coupons`,
          data: { modifiedCount: result.modifiedCount },
        })

      case 'deactivate':
        result = await Coupon.updateMany(
          { _id: { $in: couponIds } },
          { $set: { isActive: false, updatedAt: new Date() } }
        )
        return NextResponse.json({
          success: true,
          message: `Successfully deactivated ${result.modifiedCount} coupons`,
          data: { modifiedCount: result.modifiedCount },
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error performing bulk operation on coupons:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

// GET /api/coupons/bulk - Get bulk information about coupons
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication for bulk information
    const authError = await requireAdmin()
    if (authError) {
      return authError
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const couponIds = searchParams.get('ids')?.split(',')

    if (!couponIds || couponIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Coupon IDs are required' },
        { status: 400 }
      )
    }

    // Fetch coupons with populated data
    const coupons = await Coupon.find({ _id: { $in: couponIds } })
      .populate('applicableProductIds', 'title slug')
      .populate('applicableCategoryIds', 'name slug')
      .lean()

    return NextResponse.json({
      success: true,
      data: coupons,
      count: coupons.length,
    })
  } catch (error) {
    console.error('Error fetching bulk coupon information:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupon information' },
      { status: 500 }
    )
  }
}
