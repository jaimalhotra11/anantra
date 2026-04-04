import { Product } from "@/types"
import mongoose from "mongoose"

const ProductSchema = new mongoose.Schema<Product>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["draft", "archived", "published"],
            default: "draft",
        },
        services: {
            type: [String],
            enum: ["free-delivery", "cash-on-delivery", "replacement"],
            default: [],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: false,
            index: true,
        },
        defaultVariantId: {
            type: String,
        },
        variants: {
            type: [
                {
                    skuCode: {
                        type: String,
                        required: true,
                    },
                    attributes: [
                        {
                            name: {
                                type: String,
                                required: true,
                            },
                            value: {
                                type: String,
                                required: true,
                            },
                        },
                    ],
                    images: {
                        type: [String],
                        required: true,
                        default: [],
                    },
                    price: {
                        type: Number,
                        required: true,
                    },
                    cuttedPrice: {
                        type: Number,
                    },
                    trackQuantity: {
                        type: Boolean,
                        required: true,
                        default: false,
                    },
                    stockQuantity: {
                        type: Number,
                        default: 0,
                    },
                    isActive: {
                        type: Boolean,
                        default: true,
                    }
                }
            ],
            required: true,
            default: [],
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.models.Product ||
    mongoose.model<Product>("Product", ProductSchema)
