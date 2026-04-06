import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadImage } from '@/lib/cloudinary'
import { z } from 'zod'

// Hero banner schema
const heroBannerSchema = z.object({
  desktopImg: z.string().url().optional().or(z.literal('')),
  mobileImg: z.string().url().optional().or(z.literal('')),
  link: z.string().url().optional().or(z.literal(''))
})

const heroBannersArraySchema = z.array(heroBannerSchema)

// GET /api/settings/hero-banners - Fetch hero banners
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    return NextResponse.json({
      success: true,
      data: settings.heroBanners || []
    })
  } catch (error: any) {
    console.error('Error fetching hero banners:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero banners' },
      { status: 500 }
    )
  }
}

// POST /api/settings/hero-banners - Add new hero banner (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const contentType = request.headers.get('content-type')
    let validatedBanner: any
    
    // Handle FormData (with images)
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      console.log(formData)
      // Extract banner data
      const bannerData = JSON.parse(formData.get('banner') as string)
      validatedBanner = heroBannerSchema.parse(bannerData)
      
      // Handle desktop image upload
      const desktopImgFile = formData.get('desktopImg') as File
      if (desktopImgFile && desktopImgFile.size > 0) {
        const uploadResult = await uploadImage(desktopImgFile, {
          folder: 'clothing-ecommerce/hero-banners',
          transformation: {
            width: 1920,
            height: 600,
            crop: 'fill',
            quality: 'auto'
          }
        })
        
        if (uploadResult.success && uploadResult.url) {
          validatedBanner.desktopImg = uploadResult.url
        } else {
          throw new Error(`Failed to upload desktop image: ${uploadResult.error}`)
        }
      }
      
      // Handle mobile image upload
      const mobileImgFile = formData.get('mobileImg') as File
      if (mobileImgFile && mobileImgFile.size > 0) {
        const uploadResult = await uploadImage(mobileImgFile, {
          folder: 'clothing-ecommerce/hero-banners',
          transformation: {
            width: 768,
            height: 400,
            crop: 'fill',
            quality: 'auto'
          }
        })
        
        if (uploadResult.success && uploadResult.url) {
          validatedBanner.mobileImg = uploadResult.url
        } else {
          throw new Error(`Failed to upload mobile image: ${uploadResult.error}`)
        }
      }
    } else {
      // Handle regular JSON (no images)
      const body = await request.json()
      validatedBanner = heroBannerSchema.parse(body)
    }

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    if (!settings.heroBanners) {
      settings.heroBanners = []
    }

    settings.heroBanners.push(validatedBanner)
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedBanner,
      message: 'Hero banner added successfully'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding hero banner:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid banner data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add hero banner' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/hero-banners - Update all hero banners (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const validatedBanners = heroBannersArraySchema.parse(body)

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    settings.heroBanners = validatedBanners
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedBanners,
      message: 'Hero banners updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating hero banners:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid banners data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hero banners' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/hero-banners - Clear all hero banners (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const settings = await StoreSettings.findOne()
    
    if (settings) {
      settings.heroBanners = []
      await settings.save()
    }

    return NextResponse.json({
      success: true,
      message: 'Hero banners cleared successfully'
    })
  } catch (error: any) {
    console.error('Error clearing hero banners:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear hero banners' },
      { status: 500 }
    )
  }
}
