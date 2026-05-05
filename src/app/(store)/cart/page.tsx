'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react'
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
  const deliveryFee = subtotal < 2000 ? 100 : 0
  const total = subtotal + deliveryFee

  if (loading) {
    return <div className='min-h-screen py-8 px-6'>Loading cart...</div>
  }

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <div className=' border-b border-gray-200'>
        <div className='max-w-screen md:min-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='flex items-center justify-between text-sm text-gray-600 mb-4'>
            <Link className='text-primary hover:text-primary/80 transition-colors' href='/'>
              Home
            </Link>
            <span className='text-gray-400'>/</span>
            <span className='text-gray-900 font-medium'>Cart</span>
          </div>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-2'>Shopping Cart</h1>
              <p className='text-lg text-gray-600'>Review your items and proceed to checkout</p>
            </div>
            <div className='hidden md:flex items-center space-x-2 text-primary'>
              <ShoppingBag className='w-8 h-8' />
              <span className='text-2xl font-bold'>{cartItems.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-screen md:min-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {error && (
          <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8'>
            <div className='flex items-center'>
              <AlertCircle className='w-5 h-5 mr-2' />
              {error}
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-screen md:min-w-[95vw] mx-auto'>
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
              {cartItems.length === 0 ? (
                <div className='p-12 text-center'>
                  <div className='w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <ShoppingBag className='w-12 h-12 text-gray-400' />
                  </div>
                  <h3 className='text-2xl font-semibold text-gray-900 mb-2'>Your cart is empty</h3>
                  <p className='text-gray-600 mb-8 max-w-md mx-auto'>
                    Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
                  </p>
                  <Link 
                    href='/products' 
                    className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  >
                    <ShoppingBag className='w-5 h-5 mr-2' />
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className='divide-y divide-gray-100'>
                  {cartItems.map((item, index) => (
                    <div key={`${item.productId}-${item.variantId || 'default'}`} className='p-8 hover:bg-gray-50/50 transition-colors'>
                      <div className='flex items-center gap-6'>
                        <div className='w-28 h-28 rounded-xl shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden shadow-md'>
                          {item.product?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.image} alt={item.product.title} className='w-full h-full object-cover hover:scale-105 transition-transform duration-300' />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center text-gray-400'>
                              <ShoppingBag className='w-12 h-12' />
                            </div>
                          )}
                        </div>

                        <div className='flex-1 min-w-0'>
                          <h3 className='text-xl font-semibold text-gray-900 mb-2 truncate'>{item.product?.title || 'Product'}</h3>
                          {item.product?.variantAttributes?.map((attribute) => (
                            <div key={attribute.name} className='inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full mb-2 mr-2'>
                              {attribute.name}: {attribute.value}
                            </div>
                          ))}
                          <div className='flex flex-col md:flex-row gap-2 items-start justify-between mt-4'>
                            <div>
                              <p className='text-2xl font-bold text-primary'>₹{item.priceAtTime.toFixed(2)}</p>
                              <p className='text-sm text-gray-500'>per item</p>
                            </div>
                            <div className='flex items-center gap-4'>
                              <div className='flex items-center bg-gray-100 rounded-xl p-1'>
                                <button
                                  onClick={() => updateQuantity(item, item.quantity - 1)}
                                  className='w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className='w-4 h-4' />
                                </button>
                                <span className='w-12 text-center font-bold text-lg'>{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item, item.quantity + 1)}
                                  className='w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition-colors'
                                  disabled={item.quantity >= 10}
                                >
                                  <Plus className='w-4 h-4' />
                                </button>
                              </div>
                              <button 
                                onClick={() => removeItem(item)} 
                                className='w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            </div>
                          </div>
                          <div className='mt-4 pt-4 border-t border-gray-100'>
                            <div className='flex justify-between items-center'>
                              <span className='text-gray-600'>Item Total</span>
                              <span className='text-xl font-bold text-gray-900'>₹{(item.quantity * item.priceAtTime).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='lg:col-span-1'>
            <div className='sticky top-8 space-y-6'>
              {/* Order Summary Card */}
              <div className='bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
                <div className='p-6'>
                  <h3 className='text-xl font-bold text-primary mb-2'>Order Summary</h3>
                  <p className='text-gray-600 text-sm'>{cartItems.length} items in cart</p>
                </div>
                
                <div className='p-6 space-y-4'>
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center py-2'>
                      <span className='text-gray-600'>Subtotal</span>
                      <span className='font-semibold text-gray-900'>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between items-center py-2'>
                      <span className='text-gray-600'>Delivery Fee</span>
                      <span className='font-semibold text-gray-900'>
                        {deliveryFee === 0 ? (
                          <span className='text-green-600'>FREE</span>
                        ) : (
                          `₹${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                        <p className='text-sm text-blue-800'>
                          💡 Add ₹{(2000 - subtotal + 1).toFixed(0)} more for FREE delivery!
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className='border-t border-gray-200 pt-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xl font-bold text-gray-900'>Total</span>
                      <span className='text-2xl font-bold text-primary'>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href='/checkout'
                className={`block w-full px-4 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold text-lg hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                  cartItems.length === 0 ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''
                }`}
              >
                {cartItems.length === 0 ? 'Cart is Empty' : 'Proceed to Checkout'}
              </Link>

              {/* Security Badge */}
              <div className='bg-gray-50 rounded-xl p-4 border border-gray-200'>
                <div className='flex items-center justify-center space-x-2 text-gray-600'>
                  <div className='w-5 h-5 bg-green-500 rounded-full flex items-center justify-center'>
                    <svg className='w-3 h-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-sm'>Secure Checkout</span>
                </div>
                <p className='text-xs text-gray-500 text-center mt-2'>Your payment information is safe and encrypted</p>
              </div>

              {/* Continue Shopping */}
              <div className='text-center'>
                <Link href='/products' className='text-primary hover:text-primary/80 text-sm font-medium transition-colors'>
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
