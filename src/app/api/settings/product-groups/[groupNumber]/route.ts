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

// GET /api/settings/product-groups/[groupNumber] - Fetch specific product group
export async function GET(request: NextRequest, { params }: { params: Promise<{ groupNumber: string }> }) {
  try {
    await connectDB()

    const { groupNumber } = await params
    
    if (!['1', '2'].includes(groupNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid group number. Must be 1 or 2' },
        { status: 400 }
      )
    }

    const settings = await StoreSettings.findOne().lean()
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    const productGroup = groupNumber === '1' ? settings.productGroup1 : settings.productGroup2

    return NextResponse.json({
      success: true,
      data: productGroup || null
    })
  } catch (error: any) {
    console.error('Error fetching product group:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch product group' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/product-groups/[groupNumber] - Update specific product group (Admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ groupNumber: string }> }) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const { groupNumber } = await params
    
    if (!['1', '2'].includes(groupNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid group number. Must be 1 or 2' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedGroup = productGroupSchema.parse(body)

    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    settings[`productGroup${groupNumber}`] = validatedGroup
    await settings.save()

    return NextResponse.json({
      success: true,
      data: validatedGroup,
      message: `Product group ${groupNumber} updated successfully`
    })
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

// DELETE /api/settings/product-groups/[groupNumber] - Delete specific product group (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupNumber: string }> }) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const { groupNumber } = await params
    
    if (!['1', '2'].includes(groupNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid group number. Must be 1 or 2' },
        { status: 400 }
      )
    }

    const settings = await StoreSettings.findOne()
    
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'No settings found' },
        { status: 404 }
      )
    }

    settings[`productGroup${groupNumber}`] = undefined
    await settings.save()

    return NextResponse.json({
      success: true,
      message: `Product group ${groupNumber} deleted successfully`
    })
  } catch (error: any) {
    console.error('Error deleting product group:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product group' },
      { status: 500 }
    )
  }
}
