import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Variant update schema
const variantUpdateSchema = z.object({
  skuCode: z.string().min(1).optional(),
  attributes: z.array(z.object({
    name: z.string().min(1),
    value: z.string().min(1),
  })).optional(),
  images: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  cuttedPrice: z.number().optional(),
  trackQuantity: z.boolean().optional(),
  stockQuantity: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
}).partial().refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
})

// PUT /api/products/[id]/variants/[variantId] - Update a specific variant (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, variantId: string }> }
) {
  try {
    // Check admin authentication
    const { id, variantId } = await params
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const validatedData = variantUpdateSchema.parse(body)

    // Find the product
    let product
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id)
    } else {
      product = await Product.findOne({ slug: id })
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Find the variant
    const variantIndex = product.variants.findIndex(
      (variant:any) => variant._id?.toString() === variantId
    )

    if (variantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Check if new SKU code conflicts with existing variants
    if (validatedData.skuCode) {
      const existingSku = await Product.findOne({
        'variants.skuCode': validatedData.skuCode,
        _id: { $ne: product._id }
      })

      if (existingSku) {
        return NextResponse.json(
          { success: false, error: 'SKU code already exists' },
          { status: 409 }
        )
      }

      // Also check within the same product (excluding current variant)
      const sameProductSku = product.variants.some((variant:any, index:any) => 
        index !== variantIndex && variant.skuCode === validatedData.skuCode
      )

      if (sameProductSku) {
        return NextResponse.json(
          { success: false, error: 'SKU code already exists in this product' },
          { status: 409 }
        )
      }
    }

    // Update the variant
    Object.assign(product.variants[variantIndex], validatedData)
    await product.save()

    return NextResponse.json({
      success: true,
      data: product.variants[variantIndex],
      message: 'Variant updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating variant:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid variant data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update variant' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id]/variants/[variantId] - Delete a specific variant (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, variantId: string }> }
) {
  try {
    // Check admin authentication
    const { id, variantId } = await params
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    // Find the product
    let product
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id)
    } else {
      product = await Product.findOne({ slug: id })
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product has more than one variant
    if (product.variants.length <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last variant of a product' },
        { status: 400 }
      )
    }

    // Find and remove the variant
    const variantIndex = product.variants.findIndex(
      (variant:any) => variant._id?.toString() === variantId
    )

    if (variantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Remove the variant
    product.variants.splice(variantIndex, 1)

    // Update defaultVariantId if it was the deleted variant
    if (product.defaultVariantId === variantId) {
      product.defaultVariantId = product.variants[0]?._id?.toString()
    }

    await product.save()

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting variant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete variant' },
      { status: 500 }
    )
  }
}
