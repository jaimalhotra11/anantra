import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Category schema
const categorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required'),
  categoryImage: z.string().url().optional()
})

// Browse by category schema
const browseByCategorySchema = z.object({
  category1: categorySchema.optional(),
  category2: categorySchema.optional(),
  category3: categorySchema.optional(),
  category4: categorySchema.optional(),
  category5: categorySchema.optional()
})

// GET /api/settings/browse-by-category - Fetch browse by category settings
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          category1: null,
          category2: null,
          category3: null,
          category4: null,
          category5: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: settings.browseByCategory || {
        category1: null,
        category2: null,
        category3: null,
        category4: null,
        category5: null
      }
    })
  } catch (error: any) {
    console.error('Error fetching browse by category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch browse by category settings' },
      { status: 500 }
    )
  }
}

// POST /api/settings/browse-by-category - Add/update specific category (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const { categoryNumber, ...categoryData } = body
    
    if (!categoryNumber || !['1', '2', '3', '4', '5'].includes(categoryNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category number. Must be 1-5' },
        { status: 400 }
      )
    }

    const validatedCategory = categorySchema.parse(categoryData)

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
    }, { status: 201 })
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

// PUT /api/settings/browse-by-category - Update all browse by category settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const validatedData = browseByCategorySchema.parse(body)

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    settings.browseByCategory = validatedData
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedData,
      message: 'Browse by category settings updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating browse by category:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid browse by category data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update browse by category settings' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/browse-by-category - Clear all browse by category settings (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const settings = await StoreSettings.findOne()
    
    if (settings) {
      settings.browseByCategory = {}
      await settings.save()
    }

    return NextResponse.json({
      success: true,
      message: 'Browse by category settings cleared successfully'
    })
  } catch (error: any) {
    console.error('Error clearing browse by category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear browse by category settings' },
      { status: 500 }
    )
  }
}
