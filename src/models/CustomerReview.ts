import { CustomerReview } from '@/types'
import mongoose from 'mongoose'

const CustomerReviewSchema = new mongoose.Schema<CustomerReview>({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating cannot be less than 1'],
        max: [5, 'Rating cannot exceed 5'],
    },
    images: [{
        type: String,
        trim: true,
    }],
    review: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        maxlength: [1000, 'Review cannot exceed 1000 characters'],
    }
}, {
    timestamps: true,
})

// Create compound index to ensure one review per user per product
CustomerReviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

// Create indexes for better performance
CustomerReviewSchema.index({ productId: 1, rating: -1 })
CustomerReviewSchema.index({ createdAt: -1 })

const CustomerReviewModel = mongoose.models.CustomerReview || mongoose.model<CustomerReview>('CustomerReview', CustomerReviewSchema)

export default CustomerReviewModel
