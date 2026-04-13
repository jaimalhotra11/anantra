import { NextRequest, NextResponse } from 'next/server'
import WholesaleEnquiry from '@/models/WholesaleEnquiry'
import mongoose from 'mongoose'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'

// GET single wholesale enquiry
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authError = await requireAdmin()
        if (authError) {
            return authError
        }

        // Connect to database
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI!)
        }

        const enquiry = await WholesaleEnquiry.findById(params.id)
        
        if (!enquiry) {
            return NextResponse.json({
                success: false,
                message: 'Wholesale enquiry not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: enquiry
        })

    } catch (error) {
        console.error('Error fetching wholesale enquiry:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch wholesale enquiry'
        }, { status: 500 })
    }
}

// PUT update wholesale enquiry
const updateEnquirySchema = z.object({
    status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'contacted']).optional(),
    adminNotes: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
})

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if user is authenticated and is admin
        const authError = await requireAdmin()
        if (authError) {
            return authError
        }

        const body = await request.json()
        
        // Validate request body
        const validatedData = updateEnquirySchema.parse(body)

        // Connect to database
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI!)
        }

        const enquiry = await WholesaleEnquiry.findByIdAndUpdate(
            params.id,
            { $set: validatedData },
            { new: true, runValidators: true }
        )
        
        if (!enquiry) {
            return NextResponse.json({
                success: false,
                message: 'Wholesale enquiry not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Wholesale enquiry updated successfully',
            data: enquiry
        })

    } catch (error) {
        console.error('Error updating wholesale enquiry:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }, { status: 400 })
        }

        return NextResponse.json({
            success: false,
            message: 'Failed to update wholesale enquiry'
        }, { status: 500 })
    }
}

// DELETE wholesale enquiry
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const enquiry = await WholesaleEnquiry.findByIdAndDelete(params.id)
        
        if (!enquiry) {
            return NextResponse.json({
                success: false,
                message: 'Wholesale enquiry not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Wholesale enquiry deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting wholesale enquiry:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to delete wholesale enquiry'
        }, { status: 500 })
    }
}
