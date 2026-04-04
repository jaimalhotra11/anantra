import { Cart } from '@/types'
import mongoose from 'mongoose'

const CartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
    },
    priceAtTime: {
        type: Number,
        required: [true, 'Price at time is required'],
        min: [0, 'Price cannot be negative'],
    }
}, { _id: false })

const CartSchema = new mongoose.Schema<Cart>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true,
        index: true,
    },
    items: [CartItemSchema],
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative'],
        default: 0,
    }
}, {
    timestamps: true,
})

// Pre-save middleware to calculate total amount
CartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.priceAtTime * item.quantity);
    }, 0);
});

// Method to add/update item
CartSchema.methods.addItem = function(productId: string, variantId: string | null, quantity: number, priceAtTime: number) {
    const existingItemIndex = this.items.findIndex((item: any) => 
        item.productId.toString() === productId && 
        (variantId ? item.variantId?.toString() === variantId : !item.variantId)
    );

    if (existingItemIndex > -1) {
        this.items[existingItemIndex].quantity += quantity;
    } else {
        this.items.push({
            productId,
            variantId,
            quantity,
            priceAtTime
        });
    }
};

// Method to remove item
CartSchema.methods.removeItem = function(productId: string, variantId: string | null) {
    this.items = this.items.filter((item: any) => 
        !(item.productId.toString() === productId && 
          (variantId ? item.variantId?.toString() === variantId : !item.variantId))
    );
};

// Method to update item quantity
CartSchema.methods.updateItemQuantity = function(productId: string, variantId: string | null, quantity: number) {
    const item = this.items.find((item: any) => 
        item.productId.toString() === productId && 
        (variantId ? item.variantId?.toString() === variantId : !item.variantId)
    );

    if (item) {
        item.quantity = quantity;
    }
};

// Method to clear cart
CartSchema.methods.clearCart = function() {
    this.items = [];
};

const CartModel = mongoose.models.Cart || mongoose.model<Cart>('Cart', CartSchema)

export default CartModel
