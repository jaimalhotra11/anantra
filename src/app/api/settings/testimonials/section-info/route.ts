import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Testimonial section info schema
const sectionInfoSchema = z.object({
  testimonialSectionHeading: z.string().optional(),
  testimonialSectionDescription: z.string().optional()
})

// GET /api/settings/testimonials/section-info - Fetch testimonial section info
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings || !settings.testimonials) {
      return NextResponse.json({
        success: true,
        data: {
          testimonialSectionHeading: '',
          testimonialSectionDescription: ''
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        testimonialSectionHeading: settings.testimonials.testimonialSectionHeading || '',
        testimonialSectionDescription: settings.testimonials.testimonialSectionDescription || ''
      }
    })
  } catch (error: any) {
    console.error('Error fetching testimonial section info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonial section info' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/testimonials/section-info - Update testimonial section info (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const validatedSectionInfo = sectionInfoSchema.parse(body)

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

    settings.testimonials.testimonialSectionHeading = validatedSectionInfo.testimonialSectionHeading || ''
    settings.testimonials.testimonialSectionDescription = validatedSectionInfo.testimonialSectionDescription || ''
    
    await settings.save()

    return NextResponse.json({
      success: true,
      data: {
        testimonialSectionHeading: settings.testimonials.testimonialSectionHeading,
        testimonialSectionDescription: settings.testimonials.testimonialSectionDescription
      },
      message: 'Testimonial section info updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating testimonial section info:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid section info data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update testimonial section info' },
      { status: 500 }
    )
  }
}
