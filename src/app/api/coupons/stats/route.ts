import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Coupon from '@/models/Coupon'
import CouponUsage from '@/models/CouponUsage'
import { z } from 'zod'

// Query parameters schema for validation
const querySchema = z.object({
  days: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
})

// GET /api/coupons/stats - Get comprehensive coupon statistics including usage analytics
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse(Object.fromEntries(searchParams))

    const { days, discountType, isActive } = validatedQuery

    // Build base query
    const baseQuery: any = {}
    
    if (discountType) {
      baseQuery.discountType = discountType
    }
    
    if (isActive !== undefined) {
      baseQuery.isActive = isActive
    }

    // Date filter for recent coupons
    if (days) {
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      baseQuery.createdAt = { $gte: fromDate }
    }

    // Get comprehensive statistics
    const [
      totalCoupons,
      activeCoupons,
      inactiveCoupons,
      percentageCoupons,
      fixedCoupons,
      totalUsage,
      discountDistribution,
      recentCoupons,
      topUsedCoupons,
      usageByDate,
      userUsageStats,
      couponPerformance,
      revenueImpact,
    ] = await Promise.all([
      // Total coupons count
      Coupon.countDocuments(baseQuery),
      
      // Active coupons count
      Coupon.countDocuments({ ...baseQuery, isActive: true }),
      
      // Inactive coupons count
      Coupon.countDocuments({ ...baseQuery, isActive: false }),
      
      // Percentage discount coupons count
      Coupon.countDocuments({ ...baseQuery, discountType: 'percentage' }),
      
      // Fixed discount coupons count
      Coupon.countDocuments({ ...baseQuery, discountType: 'fixed' }),
      
      // Total coupon usage
      CouponUsage.countDocuments(),
      
      // Discount value distribution
      Coupon.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            avgDiscountValue: { $avg: '$discountValue' },
            maxDiscountValue: { $max: '$discountValue' },
            minDiscountValue: { $min: '$discountValue' },
            totalUsedCount: { $sum: '$usedCount' },
          },
        },
      ]),
      
      // Recent coupons (last 10)
      Coupon.find(baseQuery)
        .populate('applicableProductIds', 'title slug')
        .populate('applicableCategoryIds', 'name slug')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // Top used coupons with detailed usage info
      Coupon.aggregate([
        { $match: baseQuery },
        { $sort: { usedCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'couponusages',
            localField: '_id',
            foreignField: 'couponId',
            as: 'usages',
          },
        },
        {
          $lookup: {
            from: 'orders',
            localField: 'usages.orderId',
            foreignField: '_id',
            as: 'orders',
          },
        },
        {
          $project: {
            code: 1,
            discountType: 1,
            discountValue: 1,
            usedCount: 1,
            usageLimit: 1,
            isActive: 1,
            createdAt: 1,
            totalUsages: { $size: '$usages' },
            uniqueUsers: { $size: { $setUnion: ['$usages.userId', []] } },
            totalRevenue: { $sum: '$orders.totalAmount' },
            totalDiscountGiven: { 
              $sum: { 
                $map: { 
                  input: '$usages', 
                  as: 'usage', 
                  in: { $multiply: [ '$$usage.discountAmount', -1 ] } 
                } 
              } 
            },
          },
        },
      ]),
      
      // Usage by date (last 30 days)
      CouponUsage.aggregate([
        {
          $match: {
            usedAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$usedAt',
              },
            },
            count: { $sum: 1 },
            uniqueCoupons: { $addToSet: '$couponId' },
          },
        },
        {
          $project: {
            date: '$_id',
            count: 1,
            uniqueCoupons: { $size: '$uniqueCoupons' },
          },
        },
        { $sort: { date: 1 } },
      ]),
      
      // User usage statistics
      CouponUsage.aggregate([
        {
          $group: {
            _id: '$userId',
            usageCount: { $sum: 1 },
            uniqueCoupons: { $addToSet: '$couponId' },
            totalSavings: { $sum: 0 }, // Would need to calculate from coupon discount
            lastUsage: { $max: '$usedAt' },
          },
        },
        { $sort: { usageCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            userFullName: '$user.fullName',
            userEmail: '$user.email',
            usageCount: '$usageCount',
            uniqueCoupons: { $size: '$uniqueCoupons' },
            totalSavings: '$totalSavings',
            lastUsage: '$lastUsage',
          },
        },
      ]),
      
      // Coupon performance metrics
      Coupon.aggregate([
        { $match: baseQuery },
        {
          $lookup: {
            from: 'couponusages',
            localField: '_id',
            foreignField: 'couponId',
            as: 'usages',
          },
        },
        {
          $group: {
            _id: null,
            totalCoupons: { $sum: 1 },
            totalUsages: { $sum: { $size: '$usages' } },
            avgUsagePerCoupon: { $avg: { $size: '$usages' } },
            unusedCoupons: {
              $sum: {
                $cond: [{ $eq: [{ $size: '$usages' }, 0] }, 1, 0]
              }
            },
            highlyUsedCoupons: {
              $sum: {
                $cond: [{ $gte: [{ $size: '$usages' }, 10] }, 1, 0]
              }
            },
          },
        },
      ]),
      
      // Revenue impact analysis
      CouponUsage.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order',
          },
        },
        { $unwind: '$order' },
        {
          $lookup: {
            from: 'coupons',
            localField: 'couponId',
            foreignField: '_id',
            as: 'coupon',
          },
        },
        { $unwind: '$coupon' },
        {
          $group: {
            _id: null,
            totalOrdersWithCoupons: { $sum: 1 },
            totalRevenueFromCouponOrders: { $sum: '$order.totalAmount' },
            avgOrderValueWithCoupon: { $avg: '$order.totalAmount' },
            totalDiscountGiven: { $sum: 0 }, // Calculate based on coupon discount
          },
        },
      ]),
    ])

    // Process discount distribution
    const discountStats = discountDistribution[0] || {
      avgDiscountValue: 0,
      maxDiscountValue: 0,
      minDiscountValue: 0,
      totalUsedCount: 0,
    }

    // Calculate usage rate
    const usageRate = totalCoupons > 0 ? (totalUsage / totalCoupons) * 100 : 0

    // Process performance metrics
    const performance = couponPerformance[0] || {
      totalCoupons: 0,
      totalUsages: 0,
      avgUsagePerCoupon: 0,
      unusedCoupons: 0,
      highlyUsedCoupons: 0,
    }

    // Process revenue impact
    const revenue = revenueImpact[0] || {
      totalOrdersWithCoupons: 0,
      totalRevenueFromCouponOrders: 0,
      avgOrderValueWithCoupon: 0,
      totalDiscountGiven: 0,
    }

    // Calculate date range for the period
    let fromDate = null
    if (days) {
      const date = new Date()
      date.setDate(date.getDate() - days)
      fromDate = date.toISOString()
    }

    const stats = {
      overview: {
        totalCoupons,
        activeCoupons,
        inactiveCoupons,
        percentageCoupons,
        fixedCoupons,
        totalUsage,
        usageRate: Math.round(usageRate * 100) / 100,
      },
      distribution: {
        avgDiscountValue: Math.round(discountStats.avgDiscountValue * 100) / 100,
        maxDiscountValue: discountStats.maxDiscountValue,
        minDiscountValue: discountStats.minDiscountValue,
        totalUsedCount: discountStats.totalUsedCount,
      },
      performance: {
        ...performance,
        unusedRate: performance.totalCoupons > 0 ? 
          Math.round((performance.unusedCoupons / performance.totalCoupons) * 100) : 0,
        highlyUsedRate: performance.totalCoupons > 0 ? 
          Math.round((performance.highlyUsedCoupons / performance.totalCoupons) * 100) : 0,
      },
      revenue: {
        ...revenue,
        avgDiscountPerOrder: revenue.totalOrdersWithCoupons > 0 ? 
          revenue.totalDiscountGiven / revenue.totalOrdersWithCoupons : 0,
      },
      analytics: {
        recentCoupons,
        topUsedCoupons,
        usageByDate,
        userUsageStats,
      },
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
    console.error('Error fetching coupon stats:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupon statistics' },
      { status: 500 }
    )
  }
}
