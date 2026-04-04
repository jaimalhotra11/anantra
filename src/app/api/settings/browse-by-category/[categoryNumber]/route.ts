import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadImage } from '@/lib/cloudinary'
import { z } from 'zod'

// Category schema
const categorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required'),
  categoryImage: z.string().url().optional()
})

// GET /api/settings/browse-by-category/[categoryNumber] - Fetch specific category
export async function GET(request: NextRequest, { params }: { params: Promise<{ categoryNumber: string }> }) {
  try {
    await connectDB()

    const { categoryNumber } = await params
    
    if (!['1', '2', '3', '4', '5'].includes(categoryNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category number. Must be 1-5' },
        { status: 400 }
      )
    }

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings || !settings.browseByCategory) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    const category = settings.browseByCategory[`category${categoryNumber}`]

    return NextResponse.json({
      success: true,
      data: category || null
    })
  } catch (error: any) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/browse-by-category/[categoryNumber] - Update specific category (Admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ categoryNumber: string }> }) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const { categoryNumber } = await params
    
    if (!['1', '2', '3', '4', '5'].includes(categoryNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category number. Must be 1-5' },
        { status: 400 }
      )
    }

    const contentType = request.headers.get('content-type')
    let validatedCategory: any
    
    // Handle FormData (with images)
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Extract category data
      const categoryData = JSON.parse(formData.get('category') as string)
      validatedCategory = categorySchema.parse(categoryData)
      
      // Handle category image upload
      const categoryImageFile = formData.get('categoryImage') as File
      if (categoryImageFile && categoryImageFile.size > 0) {
        const uploadResult = await uploadImage(categoryImageFile, {
          folder: 'clothing-ecommerce/categories',
          transformation: {
            width: 400,
            height: 400,
            crop: 'fill',
            quality: 'auto'
          }
        })
        
        if (uploadResult.success && uploadResult.url) {
          validatedCategory.categoryImage = uploadResult.url
        } else {
          throw new Error(`Failed to upload category image: ${uploadResult.error}`)
        }
      }
    } else {
      // Handle regular JSON (no images)
      const body = await request.json()
      validatedCategory = categorySchema.parse(body)
    }

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    if (!settings.browseByCategory) {
      settings.browseByCategory = {}
    }

    settings.browseByCategory[`category${categoryNumber}`] = validatedCategory
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedCategory,
      message: `Category ${categoryNumber} updated successfully`
    })
  } catch (error: any) {
    console.error('Error updating category:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid category data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/browse-by-category/[categoryNumber] - Delete specific category (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ categoryNumber: string }> }) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const { categoryNumber } = await params
    
    if (!['1', '2', '3', '4', '5'].includes(categoryNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category number. Must be 1-5' },
        { status: 400 }
      )
    }

    const settings = await StoreSettings.findOne()
    
    if (!settings || !settings.browseByCategory) {
      return NextResponse.json(
        { success: false, error: 'No settings found' },
        { status: 404 }
      )
    }

    delete settings.browseByCategory[`category${categoryNumber}`]
    await settings.save()

    return NextResponse.json({
      success: true,
      message: `Category ${categoryNumber} deleted successfully`
    })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: 500 }
    )
  }
}
