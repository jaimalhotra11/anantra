import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Bulk operations schema
const bulkOperationSchema = z.object({
  action: z.enum(['delete', 'updateStatus', 'updateServices']),
  productIds: z.array(z.string()).min(1, 'At least one product ID is required'),
  data: z.object({
    status: z.enum(['draft', 'published', 'archived']).optional(),
    services: z.array(z.enum(['free-delivery', 'cash-on-delivery', 'replacement'])).optional(),
  }).optional(),
})

// POST /api/products/bulk - Bulk operations on products (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const { action, productIds, data } = bulkOperationSchema.parse(body)

    // Validate product IDs format
    const validIds = productIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/))
    if (validIds.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    let response: any

    switch (action) {
      case 'delete':
        const deleteResult = await Product.deleteMany({ _id: { $in: productIds } })
        response = {
          matchedCount: 0,
          modifiedCount: 0,
          deletedCount: deleteResult.deletedCount,
        }
        break

      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for updateStatus action' },
            { status: 400 }
          )
        }
        const updateStatusResult = await Product.updateMany(
          { _id: { $in: productIds } },
          { status: data.status }
        )
        response = {
          matchedCount: updateStatusResult.matchedCount,
          modifiedCount: updateStatusResult.modifiedCount,
          deletedCount: 0,
        }
        break

      case 'updateServices':
        if (!data?.services) {
          return NextResponse.json(
            { success: false, error: 'Services are required for updateServices action' },
            { status: 400 }
          )
        }
        const updateServicesResult = await Product.updateMany(
          { _id: { $in: productIds } },
          { services: data.services }
        )
        response = {
          matchedCount: updateServicesResult.matchedCount,
          modifiedCount: updateServicesResult.modifiedCount,
          deletedCount: 0,
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: response,
    })
  } catch (error: any) {
    console.error('Error in bulk operation:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
