import { NextRequest, NextResponse } from 'next/server'
import WholesaleEnquiry from '@/models/WholesaleEnquiry'
import mongoose from 'mongoose'
import { requireAdmin } from '@/lib/admin-auth'

// GET all wholesale enquiries for admin
export async function GET(request: NextRequest) {
    try {
        // Check if user is authenticated and is admin
        const authError = await requireAdmin()
        if (authError) {
            return authError
        }

        // Connect to database
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI!)
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const status = searchParams.get('status')
        const businessType = searchParams.get('businessType')
        const priority = searchParams.get('priority')
        const search = searchParams.get('search')

        // Build query
        const query: any = {}
        
        if (status && status !== 'all') {
            query.status = status
        }
        
        if (businessType && businessType !== 'all') {
            query.businessType = businessType
        }
        
        if (priority && priority !== 'all') {
            query.priority = priority
        }
        
        if (search) {
            query.$or = [
                { businessName: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ]
        }

        // Get enquiries with pagination
        const skip = (page - 1) * limit
        const enquiries = await WholesaleEnquiry.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        // Get total count for pagination
        const total = await WholesaleEnquiry.countDocuments(query)

        return NextResponse.json({
            success: true,
            data: {
                enquiries,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        })

    } catch (error) {
        console.error('Error fetching wholesale enquiries:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch wholesale enquiries'
        }, { status: 500 })
    }
}
