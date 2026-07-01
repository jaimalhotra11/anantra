import { NextRequest, NextResponse } from 'next/server'
import Newsletter from '@/models/Newsletter'
import mongoose from 'mongoose'
import { requireAdmin } from '@/lib/admin-auth'

// GET all newsletter subscribers for admin
export async function GET(request: NextRequest) {
    try {
        const authError = await requireAdmin()
        if (authError) {
            return authError
        }

        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI!)
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const query: any = {}

        if (status && status !== 'all') {
            query.status = status
        }

        if (search) {
            query.email = { $regex: search, $options: 'i' }
        }

        const skip = (page - 1) * limit
        const subscribers = await Newsletter.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        const total = await Newsletter.countDocuments(query)

        return NextResponse.json({
            success: true,
            data: {
                subscribers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        })

    } catch (error) {
        console.error('Error fetching newsletter subscribers:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch newsletter subscribers'
        }, { status: 500 })
    }
}
