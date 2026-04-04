import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'

const addItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
})

const updateItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1),
})

const removeItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
})

async function getAuthenticatedUserId() {
  const session = await auth()
  return session?.user?.id || null
}

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ userId })
  if (!cart) {
    cart = await Cart.create({ userId, items: [], totalAmount: 0 })
  }
  return cart
}

async function enrichCart(cart: any) {
  const productIds = cart.items.map((item: any) => item.productId)
  const products = await Product.find({ _id: { $in: productIds } })
    .select('title slug variants')
    .lean()

  const productById = new Map(products.map((product: any) => [product._id.toString(), product]))

  const items = cart.items.map((item: any) => {
    const product = productById.get(item.productId.toString())
    const variant = product?.variants?.find((v: any) => {
      if (!item.variantId) return true
      return v._id.toString() === item.variantId.toString()
    })

    return {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
      total: item.priceAtTime * item.quantity,
      product: product
        ? {
            id: product._id,
            title: product.title,
            slug: product.slug,
            image: variant?.images?.[0] || '/placeholder-product.jpg',
            variantAttributes: variant?.attributes || [],
          }
        : null,
    }
  })

  return {
    _id: cart._id,
    userId: cart.userId,
    items,
    totalAmount: cart.totalAmount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  }
}

export async function GET() {
  try {
    await connectDB()
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ success: true, data: { items: [], totalAmount: 0 } })
    }

    const cart = await getOrCreateCart(userId)
    const data = await enrichCart(cart)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching cart:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch cart' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, variantId, quantity } = addItemSchema.parse(body)

    const product = await Product.findById(productId).lean()
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const selectedVariant = variantId
      ? product.variants.find((variant: any) => variant._id.toString() === variantId)
      : product.variants.find((variant: any) => variant.isActive) || product.variants[0]

    if (!selectedVariant) {
      return NextResponse.json({ success: false, error: 'Product variant not found' }, { status: 404 })
    }

    const cart = await getOrCreateCart(userId)
    cart.addItem(productId, variantId || null, quantity, selectedVariant.price)
    await cart.save()

    const data = await enrichCart(cart)

    return NextResponse.json({ success: true, data, message: 'Item added to cart' })
  } catch (error: any) {
    console.error('Error adding cart item:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid cart payload', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Failed to add item to cart' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, variantId, quantity } = updateItemSchema.parse(body)

    const cart = await getOrCreateCart(userId)
    cart.updateItemQuantity(productId, variantId || null, quantity)
    await cart.save()

    const data = await enrichCart(cart)

    return NextResponse.json({ success: true, data, message: 'Cart updated successfully' })
  } catch (error: any) {
    console.error('Error updating cart item:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid cart payload', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Failed to update cart item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, variantId } = removeItemSchema.parse(body)

    const cart = await getOrCreateCart(userId)
    cart.removeItem(productId, variantId || null)
    await cart.save()

    const data = await enrichCart(cart)

    return NextResponse.json({ success: true, data, message: 'Item removed from cart' })
  } catch (error: any) {
    console.error('Error removing cart item:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid cart payload', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Failed to remove cart item' }, { status: 500 })
  }
}
