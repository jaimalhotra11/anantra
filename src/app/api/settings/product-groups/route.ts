import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Product group schema
const productGroupSchema = z.object({
  name: z.string().min(1, 'Product group name is required'),
  description: z.string().optional(),
  products: z.array(z.string()).default([])
})

// GET /api/settings/product-groups - Fetch all product groups
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          productGroup1: null,
          productGroup2: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        productGroup1: settings.productGroup1 || null,
        productGroup2: settings.productGroup2 || null
      }
    })
  } catch (error: any) {
    console.error('Error fetching product groups:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product groups' },
      { status: 500 }
    )
  }
}

// POST /api/settings/product-groups - Create/update product groups (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const { groupNumber, ...groupData } = body
    
    if (!groupNumber || !['1', '2'].includes(groupNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid group number. Must be 1 or 2' },
        { status: 400 }
      )
    }

    const validatedGroup = productGroupSchema.parse(groupData)

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    if (groupNumber === '1') {
      settings.productGroup1 = validatedGroup
    } else {
      settings.productGroup2 = validatedGroup
    }

    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedGroup,
      message: `Product group ${groupNumber} updated successfully`
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error updating product group:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid product group data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product group' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/product-groups - Update all product groups (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const { productGroup1, productGroup2 } = body

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    if (productGroup1 !== undefined) {
      settings.productGroup1 = productGroupSchema.parse(productGroup1)
    }

    if (productGroup2 !== undefined) {
      settings.productGroup2 = productGroupSchema.parse(productGroup2)
    }

    await settings.save()

    return NextResponse.json({
      success: true,
      data: {
        productGroup1: settings.productGroup1,
        productGroup2: settings.productGroup2
      },
      message: 'Product groups updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating product groups:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid product groups data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product groups' },
      { status: 500 }
    )
  }
}
