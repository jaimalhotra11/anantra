import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadImage } from '@/lib/cloudinary'
import { z } from 'zod'

// Hero banner schema
const heroBannerSchema = z.object({
  desktopImg: z.string().url().optional(),
  mobileImg: z.string().url().optional(),
  link: z.string().url().optional()
})

// PUT /api/settings/hero-banners/[index] - Update specific hero banner (Admin only)
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
        { success: false, error: 'Invalid banner index' },
        { status: 400 }
      )
    }

    const contentType = request.headers.get('content-type')
    let validatedBanner: any
    
    // Handle FormData (with images)
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Extract banner data
      const bannerData = JSON.parse(formData.get('banner') as string)
      validatedBanner = heroBannerSchema.parse(bannerData)
      
      // Handle desktop image upload
      const desktopImgFile = formData.get('desktopImg') as File
      if (desktopImgFile && desktopImgFile.size > 0) {
        const uploadResult = await uploadImage(desktopImgFile, {
          folder: 'clothing-ecommerce/hero-banners',
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

    const settings = await StoreSettings.findOne()
    
    if (!settings || !settings.heroBanners || indexNum >= settings.heroBanners.length) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      )
    }

    settings.heroBanners[indexNum] = validatedBanner
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedBanner,
      message: 'Hero banner updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating hero banner:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid banner data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hero banner' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/hero-banners/[index] - Delete specific hero banner (Admin only)
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
        { success: false, error: 'Invalid banner index' },
        { status: 400 }
      )
    }

    const settings = await StoreSettings.findOne()
    
    if (!settings || !settings.heroBanners || indexNum >= settings.heroBanners.length) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      )
    }

    settings.heroBanners.splice(indexNum, 1)
    await settings.save()

    return NextResponse.json({
      success: true,
      message: 'Hero banner deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting hero banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete hero banner' },
      { status: 500 }
    )
  }
}

// GET /api/settings/hero-banners/[index] - Fetch specific hero banner
export async function GET(request: NextRequest, { params }: { params: Promise<{ index: string }> }) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const { index } = await params
    const indexNum = parseInt(index)
    if (isNaN(indexNum) || indexNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid banner index' },
        { status: 400 }
      )
    }

    const settings = await StoreSettings.findOne()
    
    if (!settings || !settings.heroBanners || indexNum >= settings.heroBanners.length) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: settings.heroBanners[indexNum]
    })
  } catch (error: any) {
    console.error('Error fetching hero banner:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch hero banner' },
      { status: 500 }
    )
  }
}
