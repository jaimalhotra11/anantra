export interface User {
  id?: string,
  fullName: string,
  email: string,
  phone: string,
  avatar: string,
  role: 'admin' | 'user',
  password?: string,
  isVerified: boolean,
  verificationToken?: string,
  verificationTokenExpiry?: Date,
  createdAt: string,
  updatedAt: string,
}

export interface Category {
  _id?: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  parentCategory?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Product {
  _id?: string,
  title: string,
  description: string,
  status: 'draft' | 'archived' | 'published',
  services?: ("free-delivery" | "cash-on-delivery" | "replacement")[],
  slug: string,
  defaultVariantId?: string,
  category?: string,
  variants: {
      _id: string,
      attributes: { name: string, value: string }[],
      images: string[],
      price: number,
      cuttedPrice?: number,
      trackQuantity: boolean,
      stockQuantity?: number,
      isActive?: boolean
    }[]
}

export interface CustomerReview {
  _id?: string,
  productId: any,
  userId: any,
  rating: number,
  images: [string],
  review: string,
  createdAt: string,
  updatedAt: string,
}

export interface Cart {
  _id?: string
  userId: any
  items: {
    productId: any
    variantId?: string
    quantity: number
    priceAtTime: number
  }[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export interface Address {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface Wishlist {
  _id?: string
  userId: any
  productIds: string[]
}


export interface Order {
  _id?: string
  userId: any
  items: {
    productId: any
    variantId?: string
    title: string
    quantity: number
    price: number
    total: number
  }[]
  subtotal: number
  discount?: number
  tax?: number
  shippingCharge?: number
  totalAmount: number
  coupon?: {
    code: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    discountAmount: number
  }
  shippingAddress: Address
  razorpayOrderId: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  paymentStatus:
  | 'created'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  orderStatus:
  | 'processing'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  refundId?: string
  refundAmount?: number
  createdAt: string
  updatedAt: string
}


export interface Coupon {
  _id?: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  usedCount: Number
  usagePerUser?: number
  validFrom: Date
  validUntil: Date
  isActive: Boolean
  applicableProductIds?: string[]
  applicableCategoryIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface CouponUsage {
  _id?: string
  couponId: string
  userId: string
  orderId: string
  usedAt: Date
}

export interface StoreConfig {
  offerMarquee: string[],
  
}