import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Review schema
const reviewSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerProfile: z.string().url().optional(),
  customerMessage: z.string().min(1, 'Customer message is required'),
  customerRating: z.number().min(1).max(5)
})

// Testimonials schema
const testimonialsSchema = z.object({
  testimonialSectionHeading: z.string().optional(),
  testimonialSectionDescription: z.string().optional(),
  reviews: z.array(reviewSchema).optional()
})

// GET /api/settings/testimonials - Fetch testimonials settings
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          testimonialSectionHeading: '',
          testimonialSectionDescription: '',
          reviews: []
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: settings.testimonials || {
        testimonialSectionHeading: '',
        testimonialSectionDescription: '',
        reviews: []
      }
    })
  } catch (error: any) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}

// POST /api/settings/testimonials - Add new review (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    
    // Check if it's a review addition or full testimonial update
    if (body.isReviewAddition) {
      const validatedReview = reviewSchema.parse(body.review)

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
    } else {
      // Full testimonial update
      const validatedTestimonials = testimonialsSchema.parse(body)

      let settings = await StoreSettings.findOne()
      
      if (!settings) {
        settings = new StoreSettings()
      }

      settings.testimonials = validatedTestimonials
      await settings.save()

      return NextResponse.json({
        success: true,
        data: validatedTestimonials,
        message: 'Testimonials updated successfully'
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error updating testimonials:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid testimonials data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update testimonials' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/testimonials - Update testimonials settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const validatedTestimonials = testimonialsSchema.parse(body)

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    settings.testimonials = validatedTestimonials
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedTestimonials,
      message: 'Testimonials updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating testimonials:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid testimonials data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update testimonials' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/testimonials - Clear all testimonials (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const settings = await StoreSettings.findOne()
    
    if (settings) {
      settings.testimonials = {
        testimonialSectionHeading: '',
        testimonialSectionDescription: '',
        reviews: []
      }
      await settings.save()
    }

    return NextResponse.json({
      success: true,
      message: 'Testimonials cleared successfully'
    })
  } catch (error: any) {
    console.error('Error clearing testimonials:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear testimonials' },
      { status: 500 }
    )
  }
}
