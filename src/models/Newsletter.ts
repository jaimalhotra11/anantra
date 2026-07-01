import mongoose from 'mongoose'

const NewsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['subscribed', 'unsubscribed'],
        default: 'subscribed',
    },
}, {
    timestamps: true
})

NewsletterSchema.index({ status: 1, createdAt: -1 })

const NewsletterModel = mongoose.models.Newsletter || mongoose.model('Newsletter', NewsletterSchema)

export default NewsletterModel
