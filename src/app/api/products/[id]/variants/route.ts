import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadImage } from '@/lib/cloudinary'
import { z } from 'zod'

// Variant creation schema
const variantCreateSchema = z.object({
  skuCode: z.string().min(1, 'SKU code is required'),
  attributes: z.array(z.object({
    name: z.string().min(1, 'Attribute name is required'),
    value: z.string().min(1, 'Attribute value is required'),
  })).min(1, 'At least one attribute is required'),
  images: z.array(z.string()).default([]),
  price: z.number().min(0, 'Price must be positive'),
  cuttedPrice: z.number().optional(),
  trackQuantity: z.boolean().default(false),
  stockQuantity: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
})

// GET /api/products/[id]/variants - Get all variants of a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    // Find the product
    let product
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).select('variants')
    } else {
      product = await Product.findOne({ slug: id }).select('variants')
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product.variants,
    })
  } catch (error: any) {
    console.error('Error fetching variants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch variants' },
      { status: 500 }
    )
  }
}

// POST /api/products/[id]/variants - Add a new variant to a product (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const { id } = await params
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const contentType = request.headers.get('content-type')
    let validatedData: any
    
    // Handle FormData (with images)
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Extract variant data
      const variantData = JSON.parse(formData.get('variant') as string)
      validatedData = variantCreateSchema.parse(variantData)
      
      // Handle image uploads
      const images: string[] = []
      
      // Process images for this variant
      for (let i = 0; i < 10; i++) { // Support up to 10 images per variant
        const imageFile = formData.get(`image_${i}`) as File
        if (imageFile && imageFile.size > 0) {
          const uploadResult = await uploadImage(imageFile, {
            folder: 'clothing-ecommerce/products',
            transformation: {
              width: 800,
              height: 800,
              crop: 'fill',
              quality: 'auto'
            }
          })
          
          if (uploadResult.success && uploadResult.url) {
            images.push(uploadResult.url)
          } else {
            throw new Error(`Failed to upload image: ${uploadResult.error}`)
          }
        }
      }
      
      // Update validated data with uploaded images
      validatedData.images = images.length > 0 ? images : validatedData.images || []
      
    } else {
      // Handle regular JSON (no images)
      const body = await request.json()
      validatedData = variantCreateSchema.parse(body)
    }

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

    // Check if SKU code already exists
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

    // Add the new variant
    product.variants.push(validatedData)
    await product.save()

    // Return the newly added variant
    const newVariant = product.variants[product.variants.length - 1]

    return NextResponse.json({
      success: true,
      data: newVariant,
      message: 'Variant added successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding variant:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid variant data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add variant' },
      { status: 500 }
    )
  }
}
