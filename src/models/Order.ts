import { Order, Address } from '@/types'
import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
    },
    title: {
        type: String,
        required: [true, 'Item title is required'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
    },
    total: {
        type: Number,
        required: [true, 'Total is required'],
        min: [0, 'Total cannot be negative'],
    }
}, { _id: false })

const AddressSchema = new mongoose.Schema<Address>({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true,
    },
    addressLine2: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
    }
}, { _id: false })

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        trim: true,
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
    discountAmount: {
        type: Number,
        required: [true, 'Discount amount is required'],
        min: [0, 'Discount amount cannot be negative'],
    }
}, { _id: false })

const OrderSchema = new mongoose.Schema<Order>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    items: [OrderItemSchema],
    subtotal: {
        type: Number,
        required: [true, 'Subtotal is required'],
        min: [0, 'Subtotal cannot be negative'],
    },
    discount: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
    },
    tax: {
        type: Number,
        min: [0, 'Tax cannot be negative'],
    },
    shippingCharge: {
        type: Number,
        min: [0, 'Shipping charge cannot be negative'],
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative'],
    },
    coupon: CouponSchema,
    shippingAddress: {
        type: AddressSchema,
        required: [true, 'Shipping address is required'],
    },
    razorpayOrderId: {
        type: String,
        required: [true, 'Razorpay order ID is required'],
        unique: true,
        trim: true,
    },
    razorpayPaymentId: {
        type: String,
        trim: true,
    },
    razorpaySignature: {
        type: String,
        trim: true,
    },
    paymentStatus: {
        type: String,
        enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
        default: 'created',
        index: true,
    },
    orderStatus: {
        type: String,
        enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'processing',
        index: true,
    },
    refundId: {
        type: String,
        trim: true,
    },
    refundAmount: {
        type: Number,
        min: [0, 'Refund amount cannot be negative'],
    }
}, {
    timestamps: true,
})

// Create indexes for better performance
OrderSchema.index({ userId: 1, createdAt: -1 })
OrderSchema.index({ paymentStatus: 1, orderStatus: 1 })
OrderSchema.index({ razorpayOrderId: 1 })

// Pre-save middleware to calculate totals
OrderSchema.pre('save', function() {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    // Calculate total amount
    let total = this.subtotal;
    if (this.discount) {
        total -= this.discount;
    }
    if (this.tax) {
        total += this.tax;
    }
    if (this.shippingCharge) {
        total += this.shippingCharge;
    }
    this.totalAmount = Math.max(0, total);

});

const OrderModel = mongoose.models.Order || mongoose.model<Order>('Order', OrderSchema)

export default OrderModel
