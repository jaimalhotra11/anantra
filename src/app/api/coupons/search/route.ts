import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Coupon from '@/models/Coupon'
import { z } from 'zod'

// Search query parameters schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  minDiscountValue: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxDiscountValue: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  sortBy: z.enum(['code', 'createdAt', 'updatedAt', 'discountValue', 'usedCount', 'relevance']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// GET /api/coupons/search - Search coupons with advanced filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = searchQuerySchema.parse(Object.fromEntries(searchParams))

    const {
      q: searchQuery,
      page,
      limit,
      discountType,
      isActive,
      minDiscountValue,
      maxDiscountValue,
      sortBy,
      sortOrder,
    } = validatedQuery

    // Build search query
    const query: any = {}

    // Text search across coupon code
    query.$or = [
      { code: { $regex: searchQuery, $options: 'i' } },
    ]

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

    // Sorting logic
    let sort: any = {}
    const condition: any = { $regex: `^${searchQuery}`, $options: 'i' }
    if (sortBy === 'relevance') {
      // For relevance, we'll prioritize exact matches and then by usage and date
      sort = [
        { code: condition ? -1 : 1 },
        { usedCount: -1 },
        { createdAt: -1 },
      ]
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute search query with pagination
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

    // Add search highlighting (optional enhancement)
    const highlightedCoupons = coupons.map(coupon => ({
      ...coupon,
      // Simple highlight - you might want to use a more sophisticated approach
      highlightedCode: coupon.code.replace(
        new RegExp(searchQuery, 'gi'),
        (match:any) => `<mark>${match}</mark>`
      ),
    }))

    return NextResponse.json({
      success: true,
      data: highlightedCoupons,
      search: {
        query: searchQuery,
        filters: {
          discountType,
          isActive,
          minDiscountValue,
          maxDiscountValue,
        },
        sortBy,
        sortOrder,
      },
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
    console.error('Error searching coupons:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to search coupons' },
      { status: 500 }
    )
  }
}

// POST /api/coupons/search - Advanced search with complex queries
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    
    const advancedSearchSchema = z.object({
      query: z.string().optional(),
      filters: z.object({
        discountType: z.enum(['percentage', 'fixed']).optional(),
        isActive: z.boolean().optional(),
        minDiscountValue: z.number().min(0).optional(),
        maxDiscountValue: z.number().min(0).optional(),
        minOrderAmount: z.number().min(0).optional(),
        maxOrderAmount: z.number().min(0).optional(),
        usageLimit: z.number().min(1).optional(),
        dateRange: z.object({
          from: z.string().optional(),
          to: z.string().optional(),
        }).optional(),
        hasUsageLimit: z.boolean().optional(),
        hasUsagePerUser: z.boolean().optional(),
        hasApplicableProducts: z.boolean().optional(),
        hasApplicableCategories: z.boolean().optional(),
      }).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      sortBy: z.enum(['code', 'createdAt', 'updatedAt', 'discountValue', 'usedCount']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })

    const validatedData = advancedSearchSchema.parse(body)
    const { query, filters, page, limit, sortBy, sortOrder } = validatedData

    // Build complex query
    const searchQuery: any = {}

    // Text search
    if (query) {
      searchQuery.$or = [
        { code: { $regex: query, $options: 'i' } },
      ]
    }

    // Apply filters
    if (filters) {
      if (filters.discountType) {
        searchQuery.discountType = filters.discountType
      }

      if (filters.isActive !== undefined) {
        searchQuery.isActive = filters.isActive
      }

      if (filters.minDiscountValue !== undefined || filters.maxDiscountValue !== undefined) {
        searchQuery.discountValue = {}
        if (filters.minDiscountValue !== undefined) {
          searchQuery.discountValue.$gte = filters.minDiscountValue
        }
        if (filters.maxDiscountValue !== undefined) {
          searchQuery.discountValue.$lte = filters.maxDiscountValue
        }
      }

      if (filters.minOrderAmount !== undefined || filters.maxOrderAmount !== undefined) {
        searchQuery.minOrderAmount = {}
        if (filters.minOrderAmount !== undefined) {
          searchQuery.minOrderAmount.$gte = filters.minOrderAmount
        }
        if (filters.maxOrderAmount !== undefined) {
          searchQuery.minOrderAmount.$lte = filters.maxOrderAmount
        }
      }

      if (filters.usageLimit !== undefined) {
        searchQuery.usageLimit = filters.usageLimit
      }

      if (filters.dateRange) {
        const dateFilter: any = {}
        if (filters.dateRange.from) {
          dateFilter.$gte = new Date(filters.dateRange.from)
        }
        if (filters.dateRange.to) {
          dateFilter.$lte = new Date(filters.dateRange.to)
        }
        if (Object.keys(dateFilter).length > 0) {
          searchQuery.createdAt = dateFilter
        }
      }

      if (filters.hasUsageLimit !== undefined) {
        if (filters.hasUsageLimit) {
          searchQuery.usageLimit = { $exists: true, $ne: null }
        } else {
          searchQuery.$or = [
            { usageLimit: { $exists: false } },
            { usageLimit: null },
          ]
        }
      }

      if (filters.hasUsagePerUser !== undefined) {
        if (filters.hasUsagePerUser) {
          searchQuery.usagePerUser = { $exists: true, $ne: null }
        } else {
          searchQuery.$or = [
            { usagePerUser: { $exists: false } },
            { usagePerUser: null },
          ]
        }
      }

      if (filters.hasApplicableProducts !== undefined) {
        if (filters.hasApplicableProducts) {
          searchQuery.applicableProductIds = { $exists: true, $ne: [], $size: { $gt: 0 } }
        } else {
          searchQuery.$or = [
            { applicableProductIds: { $exists: false } },
            { applicableProductIds: { $size: 0 } },
          ]
        }
      }

      if (filters.hasApplicableCategories !== undefined) {
        if (filters.hasApplicableCategories) {
          searchQuery.applicableCategoryIds = { $exists: true, $ne: [], $size: { $gt: 0 } }
        } else {
          searchQuery.$or = [
            { applicableCategoryIds: { $exists: false } },
            { applicableCategoryIds: { $size: 0 } },
          ]
        }
      }
    }

    // Sorting
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute search
    const [coupons, totalCount] = await Promise.all([
      Coupon.find(searchQuery)
        .populate('applicableProductIds', 'title slug')
        .populate('applicableCategoryIds', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(searchQuery)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: coupons,
      search: {
        query,
        filters,
        sortBy,
        sortOrder,
      },
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
    console.error('Error performing advanced search on coupons:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid search request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform advanced search' },
      { status: 500 }
    )
  }
}
