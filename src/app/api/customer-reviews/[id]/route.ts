import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import CustomerReview from '@/models/CustomerReview'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// CustomerReview update schema
const customerReviewUpdateSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
  images: z.array(z.string()).optional(),
  review: z.string().min(1, 'Review text is required').max(1000, 'Review cannot exceed 1000 characters').optional(),
})

// GET /api/customer-reviews/[id] - Fetch a specific customer review by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }

    const review = await CustomerReview.findById(id)
      .populate('productId', 'title slug')
      .populate('userId', 'fullName email avatar')
      .lean()

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Customer review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: review,
    })
  } catch (error) {
    console.error('Error fetching customer review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer review' },
      { status: 500 }
    )
  }
}

// PUT /api/customer-reviews/[id] - Update a specific customer review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = customerReviewUpdateSchema.parse(body)

    // Check if review exists
    const existingReview = await CustomerReview.findById(id)
    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Customer review not found' },
        { status: 404 }
      )
    }

    // Update the review
    const updatedReview = await CustomerReview.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
      .populate('productId', 'title slug')
      .populate('userId', 'fullName email avatar')
      .lean()

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: 'Customer review updated successfully',
    })
  } catch (error) {
    console.error('Error updating customer review:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update customer review' },
      { status: 500 }
    )
  }
}

// DELETE /api/customer-reviews/[id] - Delete a specific customer review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }

    // Check if review exists
    const existingReview = await CustomerReview.findById(id)
    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Customer review not found' },
        { status: 404 }
      )
    }

    // Delete the review
    await CustomerReview.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Customer review deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting customer review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer review' },
      { status: 500 }
    )
  }
}
