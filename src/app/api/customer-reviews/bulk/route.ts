import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import CustomerReview from '@/models/CustomerReview'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Bulk operations schema
const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'updateStatus']),
  reviewIds: z.array(z.string()).min(1, 'At least one review ID is required'),
  data: z.object({
    status: z.enum(['approved', 'rejected', 'pending']).optional(),
  }).optional(),
})

// POST /api/customer-reviews/bulk - Perform bulk operations on customer reviews
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

    const { action, reviewIds, data } = validatedData

    // Validate that all review IDs exist
    const existingReviews = await CustomerReview.find({ _id: { $in: reviewIds } })
    if (existingReviews.length !== reviewIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more reviews not found' },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case 'delete':
        result = await CustomerReview.deleteMany({ _id: { $in: reviewIds } })
        return NextResponse.json({
          success: true,
          message: `Successfully deleted ${result.deletedCount} reviews`,
          data: { deletedCount: result.deletedCount },
        })

      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for updateStatus action' },
            { status: 400 }
          )
        }

        // Note: CustomerReview model doesn't have a status field by default
        // You might need to add it to the schema if you want to implement this
        result = await CustomerReview.updateMany(
          { _id: { $in: reviewIds } },
          { $set: { status: data.status, updatedAt: new Date() } }
        )
        
        return NextResponse.json({
          success: true,
          message: `Successfully updated ${result.modifiedCount} reviews`,
          data: { modifiedCount: result.modifiedCount },
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error performing bulk operation on customer reviews:', error)
    
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

// GET /api/customer-reviews/bulk - Get bulk information about customer reviews
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication for bulk information
    const authError = await requireAdmin()
    if (authError) {
      return authError
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const reviewIds = searchParams.get('ids')?.split(',')

    if (!reviewIds || reviewIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Review IDs are required' },
        { status: 400 }
      )
    }

    // Fetch reviews with populated data
    const reviews = await CustomerReview.find({ _id: { $in: reviewIds } })
      .populate('productId', 'title slug')
      .populate('userId', 'fullName email avatar')
      .lean()

    return NextResponse.json({
      success: true,
      data: reviews,
      count: reviews.length,
    })
  } catch (error) {
    console.error('Error fetching bulk customer review information:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer review information' },
      { status: 500 }
    )
  }
}
