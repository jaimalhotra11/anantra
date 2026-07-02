import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import Wishlist from '@/models/Wishlist'
import { auth } from '@/lib/auth'

const productIdSchema = z.object({
  productId: z.string().min(1),
})

async function getAuthenticatedUserId() {
  const session = await auth()
  const userId = session?.user?.id || null

  if (userId === 'super-admin') {
    return null
  }

  return userId
}

async function getOrCreateWishlist(userId: string) {
  let wishlist = await Wishlist.findOne({ userId })
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, productIds: [] })
  }
  return wishlist
}

export async function GET() {
  try {
    await connectDB()
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return NextResponse.json({ success: true, data: { productIds: [] } })
    }

    const wishlist = await getOrCreateWishlist(userId)

    return NextResponse.json({
      success: true,
      data: { productIds: wishlist.productIds.map((id: any) => id.toString()) },
    })
  } catch (error: any) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch wishlist' }, { status: 500 })
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
    const { productId } = productIdSchema.parse(body)

    const wishlist = await getOrCreateWishlist(userId)
    const added = (wishlist as any).toggleProduct(productId)
    await wishlist.save()

    return NextResponse.json({
      success: true,
      data: { productIds: wishlist.productIds.map((id: any) => id.toString()), added },
      message: added ? 'Added to wishlist' : 'Removed from wishlist',
    })
  } catch (error: any) {
    console.error('Error updating wishlist:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid wishlist payload', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Failed to update wishlist' }, { status: 500 })
  }
}
