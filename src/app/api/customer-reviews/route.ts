import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import CustomerReview from '@/models/CustomerReview'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Query parameters schema for validation
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  productId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  minRating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  maxRating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sortBy: z.enum(['createdAt', 'updatedAt', 'rating']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// CustomerReview creation schema
const customerReviewCreateSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  userId: z.string().min(1, 'User ID is required').optional(),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  images: z.array(z.string()).default([]),
  review: z.string().min(1, 'Review text is required').max(1000, 'Review cannot exceed 1000 characters'),
  // For dummy review creation - user object
  user: z.object({
    fullName: z.string().min(1, 'User full name is required'),
    email: z.string().email('Valid email is required'),
    avatar: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
})

// GET /api/customer-reviews - Fetch all customer reviews with filtering, pagination, sorting
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    const {
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

    // Build query
    const query: any = {}

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

    // Sorting
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query with pagination
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

    return NextResponse.json({
      success: true,
      data: reviews,
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
    console.error('Error fetching customer reviews:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer reviews' },
      { status: 500 }
    )
  }
}

// POST /api/customer-reviews - Create a new customer review
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const validatedData = customerReviewCreateSchema.parse(body)

    let finalUserId = validatedData.userId
    let reviewData: any = {
      productId: validatedData.productId,
      rating: validatedData.rating,
      images: validatedData.images,
      review: validatedData.review,
    }

    // Handle dummy user creation for admin-added reviews
    if (validatedData.user && !finalUserId) {
      // Create or find a dummy user for admin reviews
      const User = require('@/models/User').default
      let dummyUser = await User.findOne({ email: validatedData.user.email })
      
      if (!dummyUser) {
        // Create dummy user
        dummyUser = new User({
          fullName: validatedData.user.fullName,
          email: validatedData.user.email,
          avatar: validatedData.user.avatar,
          phone: validatedData.user.phone,
          role: 'user',
          isVerified: true,
          password: 'dummy-user-password', // Default password for dummy users
        })
        await dummyUser.save()
      }
      
      finalUserId = dummyUser._id.toString()
      reviewData.userId = finalUserId
    } else if (finalUserId) {
      reviewData.userId = finalUserId
    } else {
      return NextResponse.json(
        { success: false, error: 'Either userId or user object is required' },
        { status: 400 }
      )
    }

    // Check if review already exists for this user and product
    const existingReview = await CustomerReview.findOne({
      productId: validatedData.productId,
      userId: finalUserId,
    })

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 409 }
      )
    }

    // Create new review
    const review = new CustomerReview(reviewData)
    await review.save()

    // Populate the review with product and user details
    const populatedReview = await CustomerReview.findById(review._id)
      .populate('productId', 'title slug')
      .populate('userId', 'fullName email avatar')
      .lean()

    return NextResponse.json({
      success: true,
      data: populatedReview,
      message: 'Customer review created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer review:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    // Handle duplicate key error (unique constraint)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create customer review' },
      { status: 500 }
    )
  }
}
