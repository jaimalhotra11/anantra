'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Package, AlertCircle, CreditCard, MapPin, Tag, Loader2 } from 'lucide-react'
import Link from 'next/link'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

interface CartItem {
  productId: string
  variantId?: string | null
  quantity: number
  priceAtTime: number
  product: { title: string } | null
}

interface Address {
  _id: string
  label?: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  country: string
  postalCode: string
  isDefault?: boolean
}

const CheckoutPage = () => {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/sign-in?callbackUrl=/checkout')
      return
    }

    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        console.log('Razorpay script loaded successfully')
      }
      script.onerror = () => {
        console.error('Failed to load Razorpay script')
        setError('Failed to load payment gateway. Please refresh the page.')
      }
      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [session?.user, status, router])

  useEffect(() => {
    if (!session?.user) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [cartRes, addressRes] = await Promise.all([fetch('/api/cart'), fetch('/api/user/addresses')])
        const [cartJson, addressJson] = await Promise.all([cartRes.json(), addressRes.json()])

        if (!cartJson.success) throw new Error(cartJson.error || 'Unable to load cart')
        if (!addressJson.success) throw new Error(addressJson.error || 'Unable to load addresses')

        setCartItems(cartJson.data.items || [])
        setAddresses(addressJson.data || [])

        const defaultAddress = (addressJson.data || []).find((address: Address) => address.isDefault)
        if (defaultAddress?._id) {
          setSelectedAddressId(defaultAddress._id)
        } else if (addressJson.data?.length > 0) {
          setSelectedAddressId(addressJson.data[0]._id)
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load checkout data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [session?.user])

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.priceAtTime * item.quantity, 0),
    [cartItems],
  )

  const selectedAddress = addresses.find((address) => address._id === selectedAddressId)

  const applyCoupon = async () => {
    if (!couponCode.trim()) return

    try {
      setError(null)
      const response = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          subtotal,
          productIds: cartItems.map((item) => item.productId),
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Invalid coupon')

      setAppliedCoupon({ code: result.data.code, discount: result.data.discount })
    } catch (couponError) {
      setAppliedCoupon(null)
      setError(couponError instanceof Error ? couponError.message : 'Unable to apply coupon')
    }
  }

  const deliveryFee = subtotal < 2000 ? 100 : 0
  const codConvenienceFee = paymentMethod === 'cod' ? 25 : 0
  const total = Math.max(0, subtotal - (appliedCoupon?.discount || 0) + deliveryFee + codConvenienceFee)

  const placeOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address')
      return
    }

    if (paymentMethod === 'razorpay' && !window.Razorpay) {
      setError('Payment gateway is loading. Please wait...')
      return
    }

    try {
      setPlacingOrder(true)
      setError(null)

      const createOrderResponse = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: {
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            addressLine1: selectedAddress.addressLine1,
            addressLine2: selectedAddress.addressLine2,
            city: selectedAddress.city,
            state: selectedAddress.state,
            country: selectedAddress.country,
            postalCode: selectedAddress.postalCode,
          },
          couponCode: appliedCoupon?.code,
          paymentMethod,
        }),
      })

      const createOrderResult = await createOrderResponse.json()
      if (!createOrderResult.success) {
        throw new Error(createOrderResult.error || 'Unable to create order')
      }

      if (paymentMethod === 'cod') {
        // For COD, order is created directly without payment
        const orderId = createOrderResult.data.orderId
        router.push(`/order-confirmation?status=success&orderId=${orderId}&total=${total}&paymentMethod=cod`)
        return
      }

      // Razorpay payment flow
      const { orderId, razorpayOrderId, amount, currency, keyId } = createOrderResult.data

      const rzp = new (window.Razorpay as any)({
        key: keyId,
        amount,
        currency,
        name: 'Anantra Fashion',
        description: `Order #${orderId.toString().slice(-6)}`,
        order_id: razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const verifyResponse = await fetch('/api/checkout/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })

            const verifyResult = await verifyResponse.json()
            if (!verifyResult.success) {
              setError(verifyResult.error || 'Payment verification failed')
              return
            }

            router.push(`/order-confirmation?status=success&orderId=${orderId}&total=${amount/100}&paymentMethod=razorpay`)
          } catch (error) {
            console.error('Payment verification error:', error)
            router.push(`/order-confirmation?status=failed&message=Payment%20verification%20failed&orderId=${orderId}`)
          }
        },
        prefill: {
          name: selectedAddress.fullName,
          email: session?.user?.email,
          contact: selectedAddress.phone,
        },
        theme: {
          color: '#5F613A',
        },
        modal: {
          ondismiss: function() {
            router.push(`/order-confirmation?status=failed&message=Payment%20cancelled&orderId=`)
          },
          escape: false,
          handleback: false,
        },
      })

      rzp.open()
    } catch (checkoutError) {
      console.error('Checkout error:', checkoutError)
      router.push(`/order-confirmation?status=failed&message=Unable%20to%20place%20order`)
      setPlacingOrder(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className='w-screen h-[60vh] px-4 md:px-8 lg:px-16 py-10 flex flex-col gap-2 items-center justify-center'>
        <Loader2 className='w-12 h-12 animate-spin text-primary' />
        <p className='text-gray-600'>Preparing checkout...</p>
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <div className=''>
        <div className='max-w- mx-auto px-4 sm:px-6 lg:px-8 mt-5'>
          <div className='flex items-center space-x-2 text-sm text-gray-600 mb-4'>
            <Link className='text-primary hover:text-primary/80 transition-colors' href='/cart'>
              Cart
            </Link>
            <span className='text-gray-400'>/</span>
            <span className='text-gray-900 font-medium'>Checkout</span>
          </div>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-2'>Secure Checkout</h1>
              <p className='text-lg text-gray-600'>Complete your order in just a few steps</p>
            </div>
            <div className='hidden md:flex items-center space-x-2 text-primary'>
              <Package className='w-8 h-8 text-primary' />
              <span className='text-2xl font-bold'>{cartItems.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='w-screen mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {error && (
          <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8'>
            <div className='flex items-center'>
              <AlertCircle className='w-5 h-5 mr-2' />
              {error}
            </div>
          </div>
        )}

      {cartItems.length === 0 ? (
        <div className='text-center py-16'>
          <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <Package className='w-12 h-12 text-gray-400' />
          </div>
          <h3 className='text-2xl font-semibold text-gray-900 mb-2'>Your cart is empty</h3>
          <p className='text-gray-600 mb-8'>Add some items to your cart before proceeding to checkout</p>
          <Link href='/products' className='inline-flex items-center px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold'>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Checkout Form */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Delivery Address */}
            <section className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
              <div className='p-6'>
                <div className='flex items-center space-x-3'>
                  <MapPin className='w-6 h-6 text-primary' />
                  <h2 className='text-xl font-bold text-gray-900'>Delivery Address</h2>
                </div>
              </div>
              <div className='px-6 pb-6'>
                {addresses.length === 0 ? (
                  <div className='bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl text-center'>
                    <MapPin className='w-12 h-12 text-yellow-600 mx-auto mb-3' />
                    <p className='font-medium mb-3'>No saved addresses found</p>
                    <Link href="/account" className='inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium'>
                      Add Address
                    </Link>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {addresses.map((address) => (
                      <label key={address._id} className='flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200'>
                        <input
                          type='radio'
                          checked={selectedAddressId === address._id}
                          onChange={() => setSelectedAddressId(address._id)}
                          className='mt-1 w-5 h-5 text-primary focus:ring-primary'
                        />
                        <div className='flex-1'>
                          <p className='font-semibold text-gray-900 mb-1'>{address.fullName}</p>
                          <div className='space-y-1'>
                            <p className='text-gray-700'>{address.addressLine1}</p>
                            {address.addressLine2 && <p className='text-gray-700'>{address.addressLine2}</p>}
                            <p className='text-gray-700'>{address.city}, {address.state} - {address.postalCode}</p>
                            <p className='text-gray-600 text-sm'>{address.phone}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Payment Method */}
            <section className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
              <div className='p-6'>
                <div className='flex items-center space-x-3'>
                  <CreditCard className='w-6 h-6 text-primary' />
                  <h2 className='text-xl font-bold text-primary'>Payment Method</h2>
                </div>
              </div>
              <div className='px-6 pb-6'>
                <div className='space-y-4'>
                  <label className='flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200'>
                    <input
                      type='radio'
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className='w-5 h-5 text-primary focus:ring-primary'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div className='w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center'>
                          <CreditCard className='w-6 h-4 text-white' />
                        </div>
                        <p className='font-semibold text-gray-900'>Pay Online</p>
                      </div>
                      <p className='text-sm text-gray-600'>Secure payment via UPI, Cards, Net Banking, Wallets</p>
                    </div>
                  </label>
                  <label className='flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200'>
                    <input
                      type='radio'
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className='w-5 h-5 text-primary focus:ring-primary'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div className='w-12 h-8 bg-gradient-to-r from-green-600 to-green-400 rounded flex items-center justify-center'>
                          <span className='text-white font-bold text-sm'>₹</span>
                        </div>
                        <p className='font-semibold text-gray-900'>Cash on Delivery</p>
                        <span className='bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full'>+₹25</span>
                      </div>
                      <p className='text-sm text-gray-600'>Pay when you receive your order (convenience fee applies)</p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* Coupon Code */}
            <section className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
              <div className='p-6'>
                <div className='flex items-center space-x-1'>
                  <Tag className='w-6 h-6 text-primary' />
                  <h2 className='text-xl font-bold text-primary'>Apply Coupon</h2>
                </div>
              </div>
              <div className='px-6 pb-6'>
                <div className='flex gap-3'>
                  <input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder='Enter coupon code'
                    className='flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200'
                  />
                  <button 
                    onClick={applyCoupon} 
                    className='px-8 py-3  bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl'
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className='mt-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 text-primary bg-green-500 rounded-full flex items-center justify-center mr-3'>
                        <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                        </svg>
                      </div>
                      <div>
                        <p className='font-semibold'>Coupon Applied Successfully!</p>
                        <p className='text-sm'>You saved ₹{appliedCoupon.discount.toFixed(2)} on this order</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <div className='lg:col-span-1'>
            <div className='sticky top-8 space-y-6'>
              {/* Order Summary Card */}
              <div className='bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
                <div className='p-6'>
                  <h3 className='text-xl font-bold text-white mb-2'>Order Summary</h3>
                  <p className='text-primary/100 text-sm'>{cartItems.length} items ready to checkout</p>
                </div>
                
                <div className='p-6 space-y-4'>
                  {/* Items Preview */}
                  <div className='space-y-3 max-h-48 overflow-y-auto'>
                    {cartItems.map((item) => (
                      <div key={`${item.productId}-${item.variantId || 'default'}`} className='flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0'>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-gray-900 truncate'>{item.product?.title || 'Product'}</p>
                          <p className='text-sm text-gray-600'>Qty: {item.quantity}</p>
                        </div>
                        <span className='font-semibold text-gray-900 ml-2'>₹{(item.quantity * item.priceAtTime).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className='space-y-3 pt-4 border-t border-gray-200'>
                    <div className='flex justify-between items-center py-2'>
                      <span className='text-gray-600'>Subtotal</span>
                      <span className='font-semibold text-gray-900'>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className='flex justify-between items-center py-2'>
                        <span className='text-gray-600'>Discount</span>
                        <span className='font-semibold text-green-600'>-₹{appliedCoupon.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className='flex justify-between items-center py-2'>
                      <span className='text-gray-600'>Delivery Fee</span>
                      <span className='font-semibold text-gray-900'>
                        {deliveryFee === 0 ? (
                          <span className='text-green-600'>FREE</span>
                        ) : (
                          `₹${deliveryFee}`
                        )}
                      </span>
                    </div>
                    {codConvenienceFee > 0 && (
                      <div className='flex justify-between items-center py-2'>
                        <span className='text-gray-600'>COD Fee</span>
                        <span className='font-semibold text-gray-900'>₹{codConvenienceFee.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className='border-t border-gray-200 pt-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xl font-bold text-gray-900'>Total</span>
                      <span className='text-2xl font-bold text-primary'>₹{total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                disabled={placingOrder || addresses.length === 0}
                onClick={placeOrder}
                className='w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-bold text-lg hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              >
                {placingOrder ? (
                  <div className='flex items-center justify-center gap-3'>
                    <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className='flex items-center justify-center gap-2'>
                    {paymentMethod === 'razorpay' ? (
                      <>
                        <CreditCard className='w-5 h-5' />
                        <span>Pay ₹{total}</span>
                      </>
                    ) : (
                      <>
                        <Package className='w-5 h-5' />
                        <span>Place COD Order</span>
                      </>
                    )}
                  </div>
                )}
              </button>

              {/* Security Badge */}
              <div className='bg-gray-50 rounded-xl p-4 border border-gray-200'>
                <div className='flex items-center justify-center space-x-2 text-gray-600'>
                  <div className='w-5 h-5 bg-green-500 rounded-full flex items-center justify-center'>
                    <svg className='w-3 h-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-sm font-medium'>Secure Payment</span>
                </div>
                <p className='text-xs text-gray-500 text-center mt-2'>Your payment information is encrypted and secure</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default CheckoutPage
