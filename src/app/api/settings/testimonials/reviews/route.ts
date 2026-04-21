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

// GET /api/settings/testimonials/reviews - Fetch all reviews
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings || !settings.testimonials) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    return NextResponse.json({
      success: true,
      data: settings.testimonials.reviews || []
    })
  } catch (error: any) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/settings/testimonials/reviews - Add new review (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

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

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    if (!settings.testimonials) {
      settings.testimonials = {
        testimonialSectionHeading: '',
        testimonialSectionDescription: '',
        reviews: []
      }
    }

    if (!settings.testimonials.reviews) {
      settings.testimonials.reviews = []
    }

    settings.testimonials.reviews.push(validatedReview)
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedReview,
      message: 'Review added successfully'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding review:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid review data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add review' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/testimonials/reviews - Update all reviews (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const { reviews } = body

    if (!Array.isArray(reviews)) {
      return NextResponse.json(
        { success: false, error: 'Reviews must be an array' },
        { status: 400 }
      )
    }

    const validatedReviews = reviews.map(review => reviewSchema.parse(review))

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    if (!settings.testimonials) {
      settings.testimonials = {
        testimonialSectionHeading: '',
        testimonialSectionDescription: '',
        reviews: []
      }
    }

    settings.testimonials.reviews = validatedReviews
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedReviews,
      message: 'Reviews updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating reviews:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid reviews data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update reviews' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/testimonials/reviews - Clear all reviews (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const settings = await StoreSettings.findOne()
    
    if (settings && settings.testimonials) {
      settings.testimonials.reviews = []
      await settings.save()
    }

    return NextResponse.json({
      success: true,
      message: 'All reviews cleared successfully'
    })
  } catch (error: any) {
    console.error('Error clearing reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear reviews' },
      { status: 500 }
    )
  }
}
