import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db'
import UserAddress from '@/models/UserAddress'
import { auth } from '@/lib/auth'

const updateAddressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  addressLine1: z.string().min(2).optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  country: z.string().min(2).optional(),
  postalCode: z.string().min(3).optional(),
  isDefault: z.boolean().optional(),
})

async function getCurrentUserId() {
  const session = await auth()
  return session?.user?.id || null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> },
) {
  try {
    await connectDB()
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { addressId } = await params
    const body = await request.json()
    const payload = updateAddressSchema.parse(body)

    const addressBook = await UserAddress.findOne({ userId })
    if (!addressBook) {
      return NextResponse.json({ success: false, error: 'Address book not found' }, { status: 404 })
    }

    const targetAddress = addressBook.addresses.id(addressId)
    if (!targetAddress) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 })
    }

    if (payload.isDefault) {
      addressBook.addresses.forEach((address: { isDefault: boolean }) => {
        address.isDefault = false
      })
    }

    Object.assign(targetAddress, payload)
    await addressBook.save()

    return NextResponse.json({ success: true, data: addressBook.addresses, message: 'Address updated' })
  } catch (error: unknown) {
    console.error('Failed to update address:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid address payload', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to update address' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> },
) {
  try {
    await connectDB()
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { addressId } = await params

    const addressBook = await UserAddress.findOne({ userId })
    if (!addressBook) {
      return NextResponse.json({ success: false, error: 'Address book not found' }, { status: 404 })
    }

    const toDelete = addressBook.addresses.id(addressId)
    if (!toDelete) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 })
    }

    const wasDefault = toDelete.isDefault
    toDelete.deleteOne()

    if (wasDefault && addressBook.addresses.length > 0) {
      addressBook.addresses[0].isDefault = true
    }

    await addressBook.save()

    return NextResponse.json({ success: true, data: addressBook.addresses, message: 'Address deleted' })
  } catch (error) {
    console.error('Failed to delete address:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete address' }, { status: 500 })
  }
}
