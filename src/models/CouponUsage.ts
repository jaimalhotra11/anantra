import mongoose, { Types, Document } from 'mongoose'

export interface ICouponUsage extends Document {
    _id: Types.ObjectId
    couponId: Types.ObjectId
    userId: Types.ObjectId
    orderId: Types.ObjectId
    usedAt: Date
    createdAt: Date
    updatedAt: Date
}

const CouponUsageSchema = new mongoose.Schema<ICouponUsage>({
    couponId: {
        type: Types.ObjectId,
        ref: 'Coupon',
        required: [true, 'Coupon ID is required'],
        index: true,
    },
    userId: {
        type: Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    orderId: {
        type: Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order ID is required'],
        unique: true,
        index: true,
    },
    usedAt: {
        type: Date,
        required: [true, 'Used at date is required'],
        default: Date.now,
    }
}, {
    timestamps: true,
})

// Create compound indexes for better performance
CouponUsageSchema.index({ couponId: 1, userId: 1 })
CouponUsageSchema.index({ userId: 1, usedAt: -1 })

// Ensure one coupon usage per order
CouponUsageSchema.index({ orderId: 1 }, { unique: true })

const CouponUsageModel = mongoose.models.CouponUsage || mongoose.model<ICouponUsage>('CouponUsage', CouponUsageSchema)

export default CouponUsageModel
