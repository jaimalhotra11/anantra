import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Store settings update schema
const storeSettingsSchema = z.object({
  heroBanners: z.array(z.object({
    desktopImg: z.string().url().optional(),
    mobileImg: z.string().url().optional(),
    link: z.string().url().optional()
  })).optional(),
  productGroup1: z.object({
    name: z.string().min(1, 'Product group name is required'),
    description: z.string().optional(),
    products: z.array(z.string()).default([])
  }).optional(),
  productGroup2: z.object({
    name: z.string().min(1, 'Product group name is required'),
    description: z.string().optional(),
    products: z.array(z.string()).default([])
  }).optional(),
  browseByCategory: z.object({
    category1: z.object({
      categoryName: z.string().min(1, 'Category name is required'),
      categoryImage: z.string().url().optional()
    }).optional(),
    category2: z.object({
      categoryName: z.string().min(1, 'Category name is required'),
      categoryImage: z.string().url().optional()
    }).optional(),
    category3: z.object({
      categoryName: z.string().min(1, 'Category name is required'),
      categoryImage: z.string().url().optional()
    }).optional(),
    category4: z.object({
      categoryName: z.string().min(1, 'Category name is required'),
      categoryImage: z.string().url().optional()
    }).optional(),
    category5: z.object({
      categoryName: z.string().min(1, 'Category name is required'),
      categoryImage: z.string().url().optional()
    }).optional()
  }).optional(),
  testimonials: z.object({
    testimonialSectionHeading: z.string().optional(),
    testimonialSectionDescription: z.string().optional(),
    reviews: z.array(z.object({
      customerName: z.string().min(1, 'Customer name is required'),
      customerProfile: z.string().url().optional(),
      customerMessage: z.string().min(1, 'Customer message is required'),
      customerRating: z.number().min(1).max(5)
    })).optional()
  }).optional()
})

// GET /api/settings - Fetch all store settings
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    let settings = await StoreSettings.findOne().lean()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await StoreSettings.create({})
    }

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error: any) {
    console.error('Error fetching store settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch store settings' },
      { status: 500 }
    )
  }
}

// POST /api/settings - Update store settings (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const validatedData = storeSettingsSchema.parse(body)

    // Find existing settings or create new ones
    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    // Update settings with validated data
    Object.assign(settings, validatedData)
    await settings.save()

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Store settings updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating store settings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update store settings' },
      { status: 500 }
    )
  }
}
