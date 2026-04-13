import mongoose from 'mongoose'

const WholesaleEnquirySchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
    },
    contactPerson: {
        type: String,
        required: [true, 'Contact person name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    businessType: {
        type: String,
        required: [true, 'Business type is required'],
        enum: ['retail', 'boutique', 'online_store', 'distributor', 'manufacturer', 'other'],
    },
    businessAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
    },
    taxId: {
        type: String,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    productCategories: [{
        type: String,
        required: true,
    }],
    estimatedOrderVolume: {
        type: String,
        required: [true, 'Estimated order volume is required'],
        enum: ['small', 'medium', 'large', 'enterprise'],
    },
    orderFrequency: {
        type: String,
        required: [true, 'Order frequency is required'],
        enum: ['weekly', 'monthly', 'quarterly', 'seasonal', 'one_time'],
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'approved', 'rejected', 'contacted'],
        default: 'pending',
    },
    adminNotes: {
        type: String,
        trim: true,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
}, {
    timestamps: true
})

// Add indexes for better query performance
WholesaleEnquirySchema.index({ status: 1, createdAt: -1 })
WholesaleEnquirySchema.index({ email: 1 })
WholesaleEnquirySchema.index({ businessType: 1 })

const WholesaleEnquiryModel = mongoose.models.WholesaleEnquiry || mongoose.model('WholesaleEnquiry', WholesaleEnquirySchema)

export default WholesaleEnquiryModel
