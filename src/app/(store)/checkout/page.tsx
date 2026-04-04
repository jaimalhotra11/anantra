'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

interface CartItem {
  productId: string
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

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/sign-in?callbackUrl=/checkout')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
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

  const total = Math.max(0, subtotal - (appliedCoupon?.discount || 0))

  const placeOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address')
      return
    }

    if (!window.Razorpay) {
      setError('Razorpay SDK failed to load')
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
        }),
      })

      const createOrderResult = await createOrderResponse.json()
      if (!createOrderResult.success) {
        throw new Error(createOrderResult.error || 'Unable to create order')
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = createOrderResult.data

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Anantra Fashion',
        description: 'Order payment',
        order_id: razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
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

          router.push('/account')
        },
        prefill: {
          name: selectedAddress.fullName,
          email: session?.user?.email,
          contact: selectedAddress.phone,
        },
        theme: {
          color: '#5F613A',
        },
      })

      rzp.open()
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to place order')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className='px-4 md:px-8 lg:px-16 py-10'>Preparing checkout...</div>
  }

  if (!session?.user) return null

  return (
    <div className='px-4 md:px-8 lg:px-16 py-10 space-y-6'>
      <h1 className='text-3xl font-bold text-primary'>Checkout</h1>

      {error && <p className='text-sm text-red-600'>{error}</p>}

      {cartItems.length === 0 ? (
        <p className='text-muted-foreground'>Your cart is empty.</p>
      ) : (
        <>
          <section className='rounded-lg border p-4 space-y-3'>
            <h2 className='text-xl font-semibold'>Delivery Address</h2>
            {addresses.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No saved addresses. Add one from your account page.</p>
            ) : (
              addresses.map((address) => (
                <label key={address._id} className='flex items-start gap-2 border rounded-md p-3'>
                  <input
                    type='radio'
                    checked={selectedAddressId === address._id}
                    onChange={() => setSelectedAddressId(address._id)}
                  />
                  <span className='text-sm'>
                    {address.fullName}, {address.addressLine1}, {address.city}, {address.state} - {address.postalCode}
                  </span>
                </label>
              ))
            )}
          </section>

          <section className='rounded-lg border p-4 space-y-3'>
            <h2 className='text-xl font-semibold'>Apply Coupon</h2>
            <div className='flex gap-2'>
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                placeholder='Enter coupon code'
                className='border rounded-md px-3 py-2 flex-1'
              />
              <button onClick={applyCoupon} className='px-4 py-2 border rounded-md'>
                Apply
              </button>
            </div>
            {appliedCoupon && (
              <p className='text-sm text-green-700'>
                Coupon {appliedCoupon.code} applied. Discount: ₹{appliedCoupon.discount.toFixed(2)}
              </p>
            )}
          </section>

          <section className='rounded-lg border p-4 space-y-2'>
            <h2 className='text-xl font-semibold'>Order Summary</h2>
            {cartItems.map((item) => (
              <div key={`${item.productId}`} className='flex justify-between text-sm'>
                <span>
                  {item.product?.title || 'Product'} x {item.quantity}
                </span>
                <span>₹{(item.quantity * item.priceAtTime).toFixed(2)}</span>
              </div>
            ))}
            <hr />
            <div className='flex justify-between'>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span>Discount</span>
              <span>-₹{(appliedCoupon?.discount || 0).toFixed(2)}</span>
            </div>
            <div className='flex justify-between font-semibold'>
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button
              disabled={placingOrder || addresses.length === 0}
              onClick={placeOrder}
              className='w-full mt-3 py-2.5 bg-primary text-white rounded-md disabled:opacity-60'
            >
              {placingOrder ? 'Processing...' : 'Pay with Razorpay'}
            </button>
          </section>
        </>
      )}
    </div>
  )
}

export default CheckoutPage
