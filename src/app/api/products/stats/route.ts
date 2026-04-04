import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/products/stats - Get product statistics (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const { searchParams } = new URL(request.url)
    const days = searchParams.get('days')
    const daysNum = days ? parseInt(days) : 30

    // Get overall statistics
    const [
      totalProducts,
      publishedProducts,
      draftProducts,
      archivedProducts,
      totalVariants,
      activeVariants,
      outOfStockVariants,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'published' }),
      Product.countDocuments({ status: 'draft' }),
      Product.countDocuments({ status: 'archived' }),
      Product.aggregate([
        { $unwind: '$variants' },
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0),
      Product.aggregate([
        { $unwind: '$variants' },
        { $match: { 'variants.isActive': true } },
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0),
      Product.aggregate([
        { $unwind: '$variants' },
        { $match: { 
          'variants.trackQuantity': true,
          'variants.stockQuantity': { $lte: 0 },
          'variants.isActive': true
        }},
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0),
    ])

    // Get price statistics
    const priceStats = await Product.aggregate([
      { $unwind: '$variants' },
      { $match: { 'variants.isActive': true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$variants.price' },
          maxPrice: { $max: '$variants.price' },
          avgPrice: { $avg: '$variants.price' },
          medianPrice: { $median: { input: '$variants.price', method: 'approximate' } }
        }
      }
    ])

    // Get services statistics
    const servicesStats = await Product.aggregate([
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Get recent products (created in the last N days)
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - daysNum)
    
    const recentProducts = await Product.countDocuments({
      createdAt: { $gte: recentDate }
    })

    // Get products by status distribution
    const statusDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    // Get stock status distribution
    const stockDistribution = await Product.aggregate([
      { $unwind: '$variants' },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$variants.trackQuantity', false] },
              then: 'not-tracked',
              else: {
                $cond: {
                  if: { $lte: ['$variants.stockQuantity', 0] },
                  then: 'out-of-stock',
                  else: {
                    $cond: {
                      if: { $lte: ['$variants.stockQuantity', 10] },
                      then: 'low-stock',
                      else: 'in-stock'
                    }
                  }
                }
              }
            }
          },
          count: { $sum: 1 }
        }
      }
    ])

    // Get price range distribution
    const priceRanges = await Product.aggregate([
      { $unwind: '$variants' },
      { $match: { 'variants.isActive': true } },
      {
        $bucket: {
          groupBy: '$variants.price',
          boundaries: [0, 50, 100, 200, 500, 1000, Infinity],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          publishedProducts,
          draftProducts,
          archivedProducts,
          recentProducts,
        },
        variants: {
          totalVariants,
          activeVariants,
          outOfStockVariants,
        },
        pricing: priceStats[0] || {
          minPrice: 0,
          maxPrice: 0,
          avgPrice: 0,
          medianPrice: 0,
        },
        services: servicesStats,
        distributions: {
          status: statusDistribution,
          stock: stockDistribution,
          priceRanges: priceRanges,
        },
        period: {
          days: daysNum,
          fromDate: recentDate.toISOString(),
        }
      },
    })
  } catch (error: any) {
    console.error('Error fetching product stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product statistics' },
      { status: 500 }
    )
  }
}
