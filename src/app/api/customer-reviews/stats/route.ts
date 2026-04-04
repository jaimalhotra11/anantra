import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import CustomerReview from '@/models/CustomerReview'
import { z } from 'zod'

// Query parameters schema for validation
const querySchema = z.object({
  productId: z.string().optional(),
  userId: z.string().optional(),
  days: z.string().optional().transform(val => val ? parseInt(val) : undefined),
})

// GET /api/customer-reviews/stats - Get customer review statistics
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    const { productId, userId, days } = validatedQuery

    // Build base query
    const baseQuery: any = {}
    
    if (productId) {
      baseQuery.productId = productId
    }
    
    if (userId) {
      baseQuery.userId = userId
    }

    // Date filter for recent reviews
    if (days) {
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      baseQuery.createdAt = { $gte: fromDate }
    }

    // Get basic statistics
    const [
      totalReviews,
      averageRating,
      ratingDistribution,
      recentReviews,
      topRatedProducts,
    ] = await Promise.all([
      // Total reviews count
      CustomerReview.countDocuments(baseQuery),
      
      // Average rating
      CustomerReview.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      
      // Rating distribution (1-5 stars)
      CustomerReview.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      
      // Recent reviews (last 10)
      CustomerReview.find(baseQuery)
        .populate('productId', 'title slug')
        .populate('userId', 'fullName email avatar')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // Top rated products (if not filtering by specific product)
      productId ? null : CustomerReview.aggregate([
        {
          $group: {
            _id: '$productId',
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            productId: '$_id',
            productTitle: '$product.title',
            productSlug: '$product.slug',
            avgRating: { $round: ['$avgRating', 2] },
            reviewCount: 1,
          },
        },
        { $match: { reviewCount: { $gte: 3 } } }, // Only products with 3+ reviews
        { $sort: { avgRating: -1, reviewCount: -1 } },
        { $limit: 10 },
      ]),
    ])

    // Process average rating
    const avgRatingResult = averageRating[0]
    const avgRating = avgRatingResult ? Math.round(avgRatingResult.avgRating * 100) / 100 : 0

    // Process rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => {
      const found = ratingDistribution.find(item => item._id === rating)
      return {
        rating,
        count: found ? found.count : 0,
        percentage: avgRatingResult ? Math.round((found ? found.count : 0) / avgRatingResult.totalReviews * 100) : 0,
      }
    })

    // Calculate date range for the period
    let fromDate = null
    if (days) {
      const date = new Date()
      date.setDate(date.getDate() - days)
      fromDate = date.toISOString()
    }

    const stats = {
      overview: {
        totalReviews,
        averageRating: avgRating,
        totalRatingSum: avgRatingResult ? Math.round(avgRatingResult.avgRating * avgRatingResult.totalReviews * 100) / 100 : 0,
        recentReviews: recentReviews.length,
      },
      distribution,
      recentReviews,
      topRatedProducts: topRatedProducts || [],
      period: {
        days: days || null,
        fromDate,
      },
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching customer review stats:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer review statistics' },
      { status: 500 }
    )
  }
}
