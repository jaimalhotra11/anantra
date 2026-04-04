import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import CustomerReview from '@/models/CustomerReview'
import { z } from 'zod'

// Search query parameters schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  productId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  minRating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  maxRating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sortBy: z.enum(['createdAt', 'updatedAt', 'rating', 'relevance']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// GET /api/customer-reviews/search - Search customer reviews with advanced filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = searchQuerySchema.parse(Object.fromEntries(searchParams))

    const {
      q: searchQuery,
      page,
      limit,
      productId,
      userId,
      rating,
      minRating,
      maxRating,
      sortBy,
      sortOrder,
    } = validatedQuery

    // Build search query
    const query: any = {}

    // Text search across review text and populated fields
    query.$or = [
      { review: { $regex: searchQuery, $options: 'i' } },
    ]

    // Product filter
    if (productId) {
      query.productId = productId
    }

    // User filter
    if (userId) {
      query.userId = userId
    }

    // Rating filter
    if (rating !== undefined) {
      query.rating = rating
    }

    // Rating range filter
    if (minRating !== undefined || maxRating !== undefined) {
      query.rating = {}
      if (minRating !== undefined) {
        query.rating.$gte = minRating
      }
      if (maxRating !== undefined) {
        query.rating.$lte = maxRating
      }
    }

    // Sorting logic
    let sort: any = {}

    if (sortBy === 'relevance') {
      // For relevance, we'll prioritize exact matches and then by rating and date
      // This is a simplified relevance scoring
      const condition: any = { $regex: `^${searchQuery}`, $options: 'i' };

      sort = [
        { review: condition ? -1 : 1 },
        { rating: -1 },
        { createdAt: -1 },
      ]
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute search query with pagination
    const [reviews, totalCount] = await Promise.all([
      CustomerReview.find(query)
        .populate('productId', 'title slug')
        .populate('userId', 'fullName email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerReview.countDocuments(query)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)

    // Add search highlighting (optional enhancement)
    const highlightedReviews = reviews.map(review => ({
      ...review,
      // Simple highlight - you might want to use a more sophisticated approach
      highlightedReview: review.review.replace(
        new RegExp(searchQuery, 'gi'),
        (match: any) => `<mark>${match}</mark>`
      ),
    }))

    return NextResponse.json({
      success: true,
      data: highlightedReviews,
      search: {
        query: searchQuery,
        filters: {
          productId,
          userId,
          rating,
          minRating,
          maxRating,
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
    console.error('Error searching customer reviews:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to search customer reviews' },
      { status: 500 }
    )
  }
}

// POST /api/customer-reviews/search - Advanced search with complex queries
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()

    const advancedSearchSchema = z.object({
      query: z.string().optional(),
      filters: z.object({
        productId: z.string().optional(),
        userId: z.string().optional(),
        rating: z.array(z.number().min(1).max(5)).optional(),
        dateRange: z.object({
          from: z.string().optional(),
          to: z.string().optional(),
        }).optional(),
        hasImages: z.boolean().optional(),
      }).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      sortBy: z.enum(['createdAt', 'updatedAt', 'rating']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })

    const validatedData = advancedSearchSchema.parse(body)
    const { query, filters, page, limit, sortBy, sortOrder } = validatedData

    // Build complex query
    const searchQuery: any = {}

    // Text search
    if (query) {
      searchQuery.$or = [
        { review: { $regex: query, $options: 'i' } },
      ]
    }

    // Apply filters
    if (filters) {
      if (filters.productId) {
        searchQuery.productId = filters.productId
      }

      if (filters.userId) {
        searchQuery.userId = filters.userId
      }

      if (filters.rating && filters.rating.length > 0) {
        searchQuery.rating = { $in: filters.rating }
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

      if (filters.hasImages !== undefined) {
        if (filters.hasImages) {
          searchQuery.images = { $exists: true, $ne: [] }
        } else {
          searchQuery.$or = [
            { images: { $exists: false } },
            { images: { $size: 0 } },
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
    const [reviews, totalCount] = await Promise.all([
      CustomerReview.find(searchQuery)
        .populate('productId', 'title slug')
        .populate('userId', 'fullName email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerReview.countDocuments(searchQuery)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: reviews,
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
    console.error('Error performing advanced search on customer reviews:', error)

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
