import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Coupon from '@/models/Coupon'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Query parameters schema for validation
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  sortBy: z.enum(['code', 'createdAt', 'updatedAt', 'discountValue', 'usedCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  minDiscountValue: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxDiscountValue: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
})

// Coupon creation schema
const couponCreateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(20, 'Coupon code must be less than 20 characters').toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0, 'Discount value must be positive'),
  minOrderAmount: z.number().min(0, 'Minimum order amount must be positive').optional(),
  maxDiscountAmount: z.number().min(0, 'Maximum discount amount must be positive').optional(),
  usageLimit: z.number().min(1, 'Usage limit must be at least 1').optional(),
  usagePerUser: z.number().min(1, 'Usage per user must be at least 1').optional(),
  validFrom: z.string().transform(val => new Date(val)),
  validUntil: z.string().transform(val => new Date(val)),
  isActive: z.boolean().default(true),
  applicableProductIds: z.array(z.string()).optional(),
  applicableCategoryIds: z.array(z.string()).optional(),
}).refine((data) => data.validUntil > data.validFrom, {
  message: 'Valid until date must be after valid from date',
  path: ['validUntil'],
})

// GET /api/coupons - Fetch all coupons with filtering, pagination, sorting
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    const {
      page,
      limit,
      search,
      discountType,
      isActive,
      sortBy,
      sortOrder,
      minDiscountValue,
      maxDiscountValue,
    } = validatedQuery

    // Build query
    const query: any = {}

    // Search functionality
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
      ]
    }

    // Discount type filter
    if (discountType) {
      query.discountType = discountType
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive
    }

    // Discount value range filter
    if (minDiscountValue !== undefined || maxDiscountValue !== undefined) {
      query.discountValue = {}
      if (minDiscountValue !== undefined) {
        query.discountValue.$gte = minDiscountValue
      }
      if (maxDiscountValue !== undefined) {
        query.discountValue.$lte = maxDiscountValue
      }
    }

    // Sorting
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query with pagination
    const [coupons, totalCount] = await Promise.all([
      Coupon.find(query)
        .populate('applicableProductIds', 'title slug')
        .populate('applicableCategoryIds', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(query)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: coupons,
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
    console.error('Error fetching coupons:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

// POST /api/coupons - Create a new coupon
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const validatedData = couponCreateSchema.parse(body)

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: validatedData.code })
    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists' },
        { status: 409 }
      )
    }

    // Create new coupon
    const coupon = new Coupon(validatedData)
    await coupon.save()

    // Populate the coupon with related data
    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('applicableProductIds', 'title slug')
      .populate('applicableCategoryIds', 'name slug')
      .lean()

    return NextResponse.json({
      success: true,
      data: populatedCoupon,
      message: 'Coupon created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating coupon:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}
