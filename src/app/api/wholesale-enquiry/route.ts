import { NextRequest, NextResponse } from 'next/server'
import WholesaleEnquiry from '@/models/WholesaleEnquiry'
import { z } from 'zod'
import mongoose from 'mongoose'

// Validation schema for wholesale enquiry
const wholesaleEnquirySchema = z.object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    contactPerson: z.string().min(2, 'Contact person name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    businessType: z.enum(['retail', 'boutique', 'online_store', 'distributor', 'manufacturer', 'other']),
    businessAddress: z.object({
        street: z.string().min(1, 'Street address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        country: z.string().min(1, 'Country is required'),
        postalCode: z.string().min(1, 'Postal code is required'),
    }),
    taxId: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')).optional(),
    productCategories: z.array(z.string()).min(1, 'At least one product category is required'),
    estimatedOrderVolume: z.enum(['small', 'medium', 'large', 'enterprise']),
    orderFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'seasonal', 'one_time']),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message cannot exceed 1000 characters'),
    priority: z.enum(['low', 'medium', 'high']).optional(),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate request body
        const validatedData = wholesaleEnquirySchema.parse(body)

        // Connect to database
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI!)
        }

        // Create wholesale enquiry
        const wholesaleEnquiry = new WholesaleEnquiry(validatedData)
        await wholesaleEnquiry.save()

        return NextResponse.json({
            success: true,
            message: 'Wholesale enquiry submitted successfully',
            data: {
                id: wholesaleEnquiry._id,
                businessName: wholesaleEnquiry.businessName,
                status: wholesaleEnquiry.status,
                createdAt: wholesaleEnquiry.createdAt,
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Error submitting wholesale enquiry:', error)

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
            message: 'Failed to submit wholesale enquiry'
        }, { status: 500 })
    }
}
