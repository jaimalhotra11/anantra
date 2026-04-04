import { Coupon } from '@/types'
import mongoose from 'mongoose'

const CouponSchema = new mongoose.Schema<Coupon>({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: [true, 'Discount type is required'],
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
        min: [0, 'Discount value cannot be negative'],
    },
    minOrderAmount: {
        type: Number,
        min: [0, 'Minimum order amount cannot be negative'],
    },
    maxDiscountAmount: {
        type: Number,
        min: [0, 'Maximum discount amount cannot be negative'],
    },
    usageLimit: {
        type: Number,
        min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
        type: Number,
        default: 0,
        min: [0, 'Used count cannot be negative'],
    },
    usagePerUser: {
        type: Number,
        min: [1, 'Usage per user must be at least 1'],
    },
    validFrom: {
        type: Date,
        required: [true, 'Valid from date is required'],
    },
    validUntil: {
        type: Date,
        required: [true, 'Valid until date is required'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    applicableProductIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }],
    applicableCategoryIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    }]
}, {
    timestamps: true,
})

// Create indexes for better performance
CouponSchema.index({ code: 1 })
CouponSchema.index({ validFrom: 1, validUntil: 1 })
CouponSchema.index({ isActive: 1 })

// Validation to ensure validUntil is after validFrom
CouponSchema.pre('save', function(next) {
    if (this.validUntil <= this.validFrom) {
        throw new Error('Valid until date must be after valid from date');
    } 
});

// Method to check if coupon is valid
CouponSchema.methods.isValid = function(): boolean {
    const now = new Date();
    return this.isActive && 
           now >= this.validFrom && 
           now <= this.validUntil &&
           (!this.usageLimit || this.usedCount < this.usageLimit);
};

// Method to check if user can use this coupon
CouponSchema.methods.canUserUse = async function(userId: string, CouponUsageModel: any): Promise<boolean> {
    if (!this.usagePerUser) return true;
    
    const usageCount = await CouponUsageModel.countDocuments({
        couponId: this._id,
        userId: userId
    });
    
    return usageCount < this.usagePerUser;
};

// Method to calculate discount amount
CouponSchema.methods.calculateDiscount = function(orderAmount: number): number {
    let discount = 0;
    
    // Check minimum order amount
    if (this.minOrderAmount && orderAmount < this.minOrderAmount) {
        return 0;
    }
    
    if (this.discountType === 'percentage') {
        discount = (orderAmount * this.discountValue) / 100;
    } else {
        discount = this.discountValue;
    }
    
    // Apply maximum discount limit if set
    if (this.maxDiscountAmount) {
        discount = Math.min(discount, this.maxDiscountAmount);
    }
    
    return Math.min(discount, orderAmount);
};

// Method to increment used count
CouponSchema.methods.incrementUsedCount = function() {
    this.usedCount += 1;
    return this.save();
};

const CouponModel = mongoose.models.Coupon || mongoose.model<Coupon>('Coupon', CouponSchema)

export default CouponModel
