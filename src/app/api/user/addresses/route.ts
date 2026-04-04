import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import UserAddress from '@/models/UserAddress'
import { auth } from '@/lib/auth'

const createAddressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(6),
  addressLine1: z.string().min(2),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
  isDefault: z.boolean().optional(),
})

async function getCurrentUserId() {
  const session = await auth()
  return session?.user?.id || null
}

export async function GET() {
  try {
    await connectDB()
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const addressBook = await UserAddress.findOne({ userId }).lean()
    return NextResponse.json({ success: true, data: addressBook?.addresses || [] })
  } catch (error) {
    console.error('Failed to fetch addresses:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const payload = createAddressSchema.parse(body)

    let addressBook = await UserAddress.findOne({ userId })
    if (!addressBook) {
      addressBook = new UserAddress({ userId, addresses: [] })
    }

    if (payload.isDefault) {
      addressBook.addresses.forEach((address: { isDefault: boolean }) => {
        address.isDefault = false
      })
    }

    addressBook.addresses.push(payload)

    if (addressBook.addresses.length === 1) {
      addressBook.addresses[0].isDefault = true
    }

    await addressBook.save()

    return NextResponse.json({
      success: true,
      data: addressBook.addresses,
      message: 'Address added successfully',
    })
  } catch (error: unknown) {
    console.error('Failed to add address:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid address payload', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to add address' }, { status: 500 })
  }
}
