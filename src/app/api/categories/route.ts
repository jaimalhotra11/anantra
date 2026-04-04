import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Category from '@/models/Category'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Query parameters schema for validation
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  slug: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  includeInactive: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'order']).optional().default('order'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

// Category creation schema
const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  parentCategory: z.string().optional(),
  order: z.number().min(0, 'Order must be non-negative').default(0),
}).refine((data) => {
  if (data.slug) {
    return /^[a-z0-9-]+$/.test(data.slug)
  }
  return true
}, {
  message: 'Slug must contain only lowercase letters, numbers, and hyphens',
}).transform((data) => {
  // Transform "none" or empty string values to undefined for parentCategory
  if (data.parentCategory === "none" || data.parentCategory === "") {
    return { ...data, parentCategory: undefined }
  }
  return data
})

// GET /api/categories - Fetch all categories with filtering, pagination, sorting
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    const {
      page,
      limit,
      search,
      slug,
      isActive,
      includeInactive,
      sortBy,
      sortOrder,
    } = validatedQuery

    // Build query
    const query: any = {}

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    if (slug) {
      query.slug = slug
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive
    } else if (!includeInactive) {
      query.isActive = true
    }

    // Sorting
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query with pagination
    const [categories, totalCount] = await Promise.all([
      Category.find(query)
        .populate('parentCategory', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Category.countDocuments(query)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication for category creation
    const authError = await requireAdmin()
    if (authError) {
      return authError
    }

    await connectDB()

    const body = await request.json()
    const validatedData = categoryCreateSchema.parse(body)

    // Check if category name already exists
    const existingCategory = await Category.findOne({ name: validatedData.name })
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category name already exists' },
        { status: 409 }
      )
    }

    // Check if slug already exists
    const existingSlug = await Category.findOne({ slug: validatedData.slug })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: 'Category slug already exists' },
        { status: 409 }
      )
    }

    // Validate parent category if provided
    if (validatedData.parentCategory) {
      const parentCategory = await Category.findById(validatedData.parentCategory)
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 404 }
        )
      }
    }

    console.log(validatedData)

    // Create new category
    const categoryData = {
      ...validatedData,
      // Remove parentCategory if it's empty, undefined, "none", or empty string
      ...(validatedData.parentCategory && 
        validatedData.parentCategory !== "none" && 
        validatedData.parentCategory !== "" 
        ? { parentCategory: validatedData.parentCategory } 
        : {})
    };
    
    const category = new Category(categoryData)
    await category.save()

    // Populate the category with parent category details
    const populatedCategory = await Category.findById(category._id)
      .populate('parentCategory', 'name slug')
      .lean()

    return NextResponse.json({
      success: true,
      data: populatedCategory,
      message: 'Category created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'Category name or slug already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
