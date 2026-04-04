import { Wishlist } from '@/types'
import mongoose from 'mongoose'

const WishlistSchema = new mongoose.Schema<Wishlist>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true,
        index: true,
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }]
}, {
    timestamps: true,
})

// Method to add product to wishlist
WishlistSchema.methods.addProduct = function(productId: string) {
    if (!this.productIds.includes(productId)) {
        this.productIds.push(productId);
    }
};

// Method to remove product from wishlist
WishlistSchema.methods.removeProduct = function(productId: string) {
    this.productIds = this.productIds.filter((id: any) => id.toString() !== productId);
};

// Method to check if product exists in wishlist
WishlistSchema.methods.hasProduct = function(productId: string): boolean {
    return this.productIds.some((id: any) => id.toString() === productId);
};

// Method to toggle product in wishlist
WishlistSchema.methods.toggleProduct = function(productId: string): boolean {
    const index = this.productIds.findIndex((id: any) => id.toString() === productId);
    if (index > -1) {
        this.productIds.splice(index, 1);
        return false; // Product removed
    } else {
        this.productIds.push(productId);
        return true; // Product added
    }
};

const WishlistModel = mongoose.models.Wishlist || mongoose.model<Wishlist>('Wishlist', WishlistSchema)

export default WishlistModel
