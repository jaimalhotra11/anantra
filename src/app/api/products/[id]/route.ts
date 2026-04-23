import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadImage } from '@/lib/cloudinary'
import { z } from 'zod'

// Product update schema
const productUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  services: z.array(z.enum(['free-delivery', 'cash-on-delivery', 'replacement'])).optional(),
  slug: z.string().min(1).optional(),
  category: z.string().optional(),
  sizeChartImage: z.string().optional(),
  defaultVariantId: z.string().optional(),
  variants: z.array(z.object({
    _id: z.string().optional(),
    skuCode: z.string().min(1),
    attributes: z.array(z.object({
      name: z.string().min(1),
      value: z.string().min(1),
    })).min(1),
    images: z.array(z.string()).default([]),
    price: z.number().min(0),
    cuttedPrice: z.number().optional(),
    trackQuantity: z.boolean().default(false),
    stockQuantity: z.number().min(0).default(0),
    isActive: z.boolean().default(true),
  })).optional(),
}).partial().refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
})

// GET /api/products/[id] - Fetch a single product by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Try to find by ID first, then by slug
    let product;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: id }).populate('category', 'name slug');
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product (Admin only)
export async function PUT(
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
      
      // Extract product data
      const productData = JSON.parse(formData.get('product') as string)
      validatedData = productUpdateSchema.parse(productData)
      
      // Handle image uploads if variants are being updated
      if (validatedData.variants) {
        const processedVariants = await Promise.all(
          validatedData.variants.map(async (variant: any) => {
            const images: string[] = []
            
            // Process images for this variant
            for (let i = 0; i < 10; i++) { // Support up to 10 images per variant
              const imageFile = formData.get(`variant_${variant.skuCode}_image_${i}`) as File
              if (imageFile && imageFile.size > 0 && variant.skuCode) {
                  const uploadResult = await uploadImage(imageFile, {
                    folder: 'clothing-ecommerce/products',
                })
                
                if (uploadResult.success && uploadResult.url) {
                  images.push(uploadResult.url)
                } else {
                  throw new Error(`Failed to upload image: ${uploadResult.error}`)
                }
              }
            }
            
            return {
              ...variant,
              images: images.length > 0 ? images : variant.images || []
            }
          })
        )
        
        // Update validated data with processed variants
        validatedData.variants = processedVariants
      }
      
      // Handle size chart image upload
      const sizeChartFile = formData.get('sizeChartImage') as File
      if (sizeChartFile && sizeChartFile.size > 0) {
        const uploadResult = await uploadImage(sizeChartFile, {
          folder: 'clothing-ecommerce/size-charts',
        })
        
        if (uploadResult.success && uploadResult.url) {
          validatedData.sizeChartImage = uploadResult.url
        } else {
          throw new Error(`Failed to upload size chart image: ${uploadResult.error}`)
        }
      }
      
    } else {
      // Handle regular JSON (no images)
      const body = await request.json()
      validatedData = productUpdateSchema.parse(body)
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

    // Check if new slug conflicts with existing products (if slug is being updated)
    if (validatedData.slug && validatedData.slug !== product.slug) {
      const existingProduct = await Product.findOne({ 
        slug: validatedData.slug,
        _id: { $ne: product._id }
      })
      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Product with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Check for SKU conflicts if variants are being updated
    if (validatedData.variants) {
      const skuCodes = validatedData.variants.map((v: any) => v.skuCode)
      const existingSku = await Product.findOne({
        'variants.skuCode': { $in: skuCodes },
        _id: { $ne: product._id }
      })
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: 'One or more SKU codes already exist' },
          { status: 409 }
        )
      }
    }

    // Update the product
    Object.assign(product, validatedData)
    await product.save()

    // Populate the product with category details
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug')
      .lean()

    return NextResponse.json({
      success: true,
      data: populatedProduct,
      message: 'Product updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating product:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid product data', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Product with this slug or SKU already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const { id } = await params
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    // Find and delete the product
    let product
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndDelete(id)
    } else {
      product = await Product.findOneAndDelete({ slug: id })
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
