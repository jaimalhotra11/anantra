'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  readGuestCart,
  removeGuestCartItem,
  updateGuestCartItem,
  type GuestCartItem,
} from '@/lib/storefront'

interface ApiCartItem {
  productId: string
  variantId?: string
  quantity: number
  priceAtTime: number
  product: {
    title: string
    slug: string
    image: string
    variantAttributes: { name: string; value: string }[]
  } | null
}

const CartPage = () => {
  const { data: session } = useSession()
  const [cartItems, setCartItems] = useState<ApiCartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapGuestItems = (items: GuestCartItem[]): ApiCartItem[] =>
    items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
      product: {
        title: item.product.title,
        slug: item.product.slug,
        image: item.product.image,
        variantAttributes: item.product.variantAttributes,
      },
    }))

  const loadCart = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!session?.user) {
        setCartItems(mapGuestItems(readGuestCart()))
        return
      }

      const response = await fetch('/api/cart', { cache: 'no-store' })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load cart')
      }

      setCartItems(result.data.items || [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  const updateQuantity = async (item: ApiCartItem, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      if (!session?.user) {
        const updated = updateGuestCartItem(item.productId, item.variantId, newQuantity)
        setCartItems(mapGuestItems(updated))
        return
      }

      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          variantId: item.variantId,
          quantity: newQuantity,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to update quantity')
      }

      setCartItems(result.data.items || [])
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update item')
    }
  }

  const removeItem = async (item: ApiCartItem) => {
    try {
      if (!session?.user) {
        const updated = removeGuestCartItem(item.productId, item.variantId)
        setCartItems(mapGuestItems(updated))
        return
      }

      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          variantId: item.variantId,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove item')
      }

      setCartItems(result.data.items || [])
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Failed to remove item')
    }
  }

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.priceAtTime * item.quantity, 0),
    [cartItems],
  )
  const discount = subtotal * 0.1
  const deliveryFee = subtotal > 0 ? 15 : 0
  const total = subtotal - discount + deliveryFee

  if (loading) {
    return <div className='min-h-screen py-8 px-6'>Loading cart...</div>
  }

  return (
    <div className='min-h-screen py-8 w-full'>
      <div className='max-w-7xl w-full mx-auto px-4 md:px-8'>
        <div className='flex items-start space-x-2 text-sm text-neutral-600 mb-6'>
          <Link className='text-primary' href='/'>
            Home
          </Link>
          <span>/</span>
          <span>Cart</span>
        </div>

        <h2 className='sm:text-3xl text-2xl font-bold font-serif mb-8'>Your Cart</h2>

        {error && <p className='text-sm text-red-600 mb-4'>{error}</p>}

        <div className='w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8'>
          <div className='w-full lg:w-2/3 border shadow-sm border-primary/20 rounded-xl space-y-4'>
            {cartItems.length === 0 ? (
              <div className='p-6'>
                <p className='text-muted-foreground'>Your cart is empty.</p>
                <Link href='/products' className='inline-block mt-3 text-primary underline'>
                  Continue shopping
                </Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={`${item.productId}-${item.variantId || 'default'}`} className='rounded-lg p-4'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-24 h-24 rounded-md shrink-0 bg-muted overflow-hidden'>
                      {item.product?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.image} alt={item.product.title} className='w-full h-full object-cover' />
                      ) : null}
                    </div>

                    <div className='flex-1'>
                      <h3 className='font-medium text-neutral-900'>{item.product?.title || 'Product'}</h3>
                      {item.product?.variantAttributes?.map((attribute) => (
                        <p key={attribute.name} className='text-sm text-neutral-600'>
                          {attribute.name}: {attribute.value}
                        </p>
                      ))}
                      <p className='font-semibold text-primary mt-1'>₹ {item.priceAtTime}</p>
                    </div>

                    <div className='flex flex-col items-end space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          className='w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 cursor-pointer'
                        >
                          <Minus className='w-4 h-4' />
                        </button>
                        <span className='w-8 text-center'>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          className='w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 cursor-pointer'
                        >
                          <Plus className='w-4 h-4' />
                        </button>
                        <button onClick={() => removeItem(item)} className='text-black cursor-pointer'>
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className='flex-1'>
            <div className='rounded-lg p-6 shadow-sm border border-primary/20'>
              <h3 className='text-lg font-semibold mb-4'>Order Summary</h3>

              <div className='space-y-3 mb-4'>
                <div className='flex justify-between text-sm'>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Discount (-10%)</span>
                  <span className='text-green-600'>-₹{discount.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className='border-t pt-3'>
                  <div className='flex justify-between font-semibold'>
                    <span>Total</span>
                    <span className='text-primary'>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                href='/checkout'
                className={`block text-center w-full py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-hover transition-colors ${
                  cartItems.length === 0 ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                Go to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
