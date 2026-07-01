import { NextRequest, NextResponse } from 'next/server'
import Newsletter from '@/models/Newsletter'
import mongoose from 'mongoose'
import { requireAdmin } from '@/lib/admin-auth'

// DELETE newsletter subscriber
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireAdmin()
        if (authError) {
            return authError
        }

        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI!)
        }

        const { id } = await params
        const subscriber = await Newsletter.findByIdAndDelete(id)

        if (!subscriber) {
            return NextResponse.json({
                success: false,
                message: 'Subscriber not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Subscriber deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting newsletter subscriber:', error)
        return NextResponse.json({
            success: false,
            message: 'Failed to delete subscriber'
        }, { status: 500 })
    }
}
