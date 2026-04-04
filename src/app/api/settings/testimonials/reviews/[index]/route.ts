import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadImage } from '@/lib/cloudinary'
import { z } from 'zod'

// Review schema
const reviewSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerProfile: z.string().url().optional(),
  customerMessage: z.string().min(1, 'Customer message is required'),
  customerRating: z.number().min(1).max(5)
})

// GET /api/settings/testimonials/reviews/[index] - Fetch specific review
export async function GET(request: NextRequest, { params }: { params: Promise<{ index: string }> }) {
  try {
    await connectDB()

    const { index } = await params
    const indexNum = parseInt(index)
    if (isNaN(indexNum) || indexNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid review index' },
        { status: 400 }
      )
    }

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings || !settings.testimonials || !settings.testimonials.reviews || indexNum >= settings.testimonials.reviews.length) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    const review = settings.testimonials.reviews[indexNum]

    return NextResponse.json({
      success: true,
      data: review
    })
  } catch (error: any) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/testimonials/reviews/[index] - Update specific review (Admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ index: string }> }) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const { index } = await params
    const indexNum = parseInt(index)
    if (isNaN(indexNum) || indexNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid review index' },
        { status: 400 }
      )
    }

    const contentType = request.headers.get('content-type')
    let validatedReview: any
    
    // Handle FormData (with images)
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Extract review data
      const reviewData = JSON.parse(formData.get('review') as string)
      validatedReview = reviewSchema.parse(reviewData)
      
      // Handle customer profile image upload
      const customerProfileFile = formData.get('customerProfile') as File
      if (customerProfileFile && customerProfileFile.size > 0) {
        const uploadResult = await uploadImage(customerProfileFile, {
          folder: 'clothing-ecommerce/testimonials',
          transformation: {
            width: 200,
            height: 200,
            crop: 'fill',
            quality: 'auto'
          }
        })
        
        if (uploadResult.success && uploadResult.url) {
          validatedReview.customerProfile = uploadResult.url
        } else {
          throw new Error(`Failed to upload customer profile image: ${uploadResult.error}`)
        }
      }
    } else {
      // Handle regular JSON (no images)
      const body = await request.json()
      validatedReview = reviewSchema.parse(body)
    }

    const settings = await StoreSettings.findOne()
    
    if (!settings || !settings.testimonials || !settings.testimonials.reviews || indexNum >= settings.testimonials.reviews.length) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    settings.testimonials.reviews[indexNum] = validatedReview
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedReview,
      message: 'Review updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating review:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid review data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update review' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/testimonials/reviews/[index] - Delete specific review (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ index: string }> }) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const { index } = await params
    const indexNum = parseInt(index)
    if (isNaN(indexNum) || indexNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid review index' },
        { status: 400 }
      )
    }

    const settings = await StoreSettings.findOne()
    
    if (!settings || !settings.testimonials || !settings.testimonials.reviews || indexNum >= settings.testimonials.reviews.length) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    settings.testimonials.reviews.splice(indexNum, 1)
    await settings.save()

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
