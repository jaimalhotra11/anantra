import { Category } from '@/types'
import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema<Category>({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
    },
    slug: {
        type: String,
        required: [true, 'Category slug is required'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
})

// Create indexes for better performance (excluding name and slug as they're already indexed by unique: true)
CategorySchema.index({ isActive: 1 })
CategorySchema.index({ parentCategory: 1 })

const CategoryModel = mongoose.models.Category || mongoose.model<Category>('Category', CategorySchema)

export default CategoryModel
