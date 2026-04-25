import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/admin-auth'
import { uploadImage } from '@/lib/cloudinary'
import { z } from 'zod'

// Query parameters schema for validation
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  includeAllStatuses: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'price']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  services: z.string().optional().transform(val => val ? val.split(',') : undefined),
  category: z.string().optional(),
  colors: z.string().optional().transform(val => val ? val.split(',') : undefined),
  sizes: z.string().optional().transform(val => val ? val.split(',') : undefined),
})

// Product creation schema
const productCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  services: z.array(z.enum(['free-delivery', 'cash-on-delivery', 'replacement'])).default([]),
  slug: z.string().min(1, 'Slug is required'),
  category: z.string().optional(),
  sizeChartImage: z.string().optional(),
  defaultVariantId: z.string().optional(),
  variants: z.array(z.object({
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
  })).min(1, 'At least one variant is required'),
})

// GET /api/products - Fetch all products with filtering, pagination, sorting
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    const {
      page,
      limit,
      search,
      status,
      includeAllStatuses,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
      services,
      category,
      colors,
      sizes,
    } = validatedQuery

    // Build query
    const query: any = {}

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'variants.skuCode': { $regex: search, $options: 'i' } },
      ]
    }

    // Status filter (storefront defaults to published products only)
    if (status) {
      query.status = status
    } else if (!includeAllStatuses) {
      query.status = 'published'
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query['variants.price'] = {}
      if (minPrice !== undefined) {
        query['variants.price'].$gte = minPrice
      }
      if (maxPrice !== undefined) {
        query['variants.price'].$lte = maxPrice
      }
    }

    // Services filter
    if (services && services.length > 0) {
      query.services = { $in: services }
    }

    // Category filter
    if (category) {
      query.category = category
    }

    // Colors filter - filter products that have variants with the specified colors
    if (colors && colors.length > 0) {
      query['variants.attributes'] = {
        $elemMatch: {
          name: 'color',
          value: { $in: colors }
        }
      }
    }

    // Sizes filter - filter products that have variants with the specified sizes
    if (sizes && sizes.length > 0) {
      if (query['variants.attributes']) {
        // If we already have a color filter, we need to combine them
        query['variants.attributes'] = {
          $and: [
            query['variants.attributes'],
            {
              $elemMatch: {
                name: 'size',
                value: { $in: sizes }
              }
            }
          ]
        }
      } else {
        query['variants.attributes'] = {
          $elemMatch: {
            name: 'size',
            value: { $in: sizes }
          }
        }
      }
    }

    // Sorting
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute query with pagination
    const skip = (page - 1) * limit

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
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
      validatedData = productCreateSchema.parse(productData)

      // Handle image uploads for each variant
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
      validatedData = productCreateSchema.parse(body)
    }

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug: validatedData.slug })
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product with this slug already exists' },
        { status: 409 }
      )
    }

    // Check if any SKU code already exists
    const skuCodes = validatedData.variants.map((v: any) => v.skuCode)
    const existingSku = await Product.findOne({
      'variants.skuCode': { $in: skuCodes }
    })
    if (existingSku) {
      return NextResponse.json(
        { success: false, error: 'One or more SKU codes already exist' },
        { status: 409 }
      )
    }

    const product = new Product(validatedData)
    await product.save()

    // Populate the product with category details
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug')
      .lean()

    return NextResponse.json({
      success: true,
      data: populatedProduct,
      message: 'Product created successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid product data', details: error.errors },
        { status: 400 }
      )
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Product with this slug or SKU already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
