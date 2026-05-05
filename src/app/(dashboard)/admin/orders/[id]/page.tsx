'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertCircle, Package, Truck, CreditCard, MapPin, Calendar, Edit3 } from 'lucide-react'

interface Order {
  _id: string
  totalAmount: number
  subtotal: number
  discount?: number
  paymentStatus: 'created' | 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  razorpayOrderId: string
  razorpayPaymentId?: string
  paymentMethod?: 'razorpay' | 'cod'
  shippingAddress: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  user?: {
    fullName: string
    email: string
    phone: string
  }
  adminRemarks?: string
  trackingNumber?: string
  estimatedDelivery?: string
  items?: Array<{
    productId: string
    variantId?: string
    title: string
    quantity: number
    price: number
    total: number
    product?: {
      title: string
      image?: string
    }
  }>
}

const OrderDetailsPage = () => {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/orders/${orderId}`)
        const result = await response.json()
        if (!result.success) throw new Error(result.error || 'Failed to load order')
        setOrder(result.data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) loadOrder()
  }, [orderId])

  const saveOrder = async () => {
    if (!order) return
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          adminRemarks: order.adminRemarks,
          trackingNumber: order.trackingNumber,
          estimatedDelivery: order.estimatedDelivery,
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to update order')
      setOrder(result.data)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading order details...</p>
  if (!order) return <p className='text-red-600'>{error || 'Order not found'}</p>

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='border-b border-gray-200'>
        <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl md:text-5xl font-bold text-neutral-200 mb-2'>Order #{order._id.slice(-6)}</h1>
              <p className='text-lg text-neutral-100'>Manage order details and status</p>
            </div>
            {error && (
              <div className='bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg'>
                <div className='flex items-center'>
                  <AlertCircle className='w-5 h-5 mr-2' />
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className='bg-neutral-900 text-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
              <div className='px-6 pt-6'>
                <div className='flex items-center space-x-3'>
                  <Package className='w-6 h-6 text-white' />
                  <h2 className='text-xl font-bold text-white'>Order Items</h2>
                </div>
              </div>
              <div className='p-6 space-y-4'>
                {order.items.map((item, index) => (
                  <div key={index} className='flex items-center gap-6 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors'>
                    <div className='w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md'>
                      {item.product?.image ? (
                        <img src={item.product.image} alt={item.product.title} className='w-full h-full object-cover hover:scale-105 transition-transform duration-300' />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-neutral-200'>
                          <Package className='w-8 h-8' />
                        </div>
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-lg font-semibold text-neutral-100 mb-1 truncate'>{item.title || item.product?.title || 'Product'}</h3>
                      <div className='flex items-center gap-4 mb-2'>
                        <span className='inline-flex items-center px-3 py-1 text-neutral-100 text-sm rounded-full'>
                          Qty: {item.quantity}
                        </span>
                        <span className='text-sm text-neutral-100'>₹{item.price.toFixed(2)} each</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-neutral-100'>Item Total</span>
                        <span className='text-lg font-bold text-primary'>₹{item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer & Shipping Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Customer Info */}
            <div className='bg-neutral-900 text-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <h2 className='text-lg font-bold text-neutral-300 mb-4'>Customer Information</h2>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-neutral-100'>Name</p>
                  <p className='font-medium text-neutral-100'>{order.user?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-sm text-neutral-100'>Email</p>
                  <p className='font-medium text-neutral-100'>{order.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-sm text-neutral-100'>Phone</p>
                  <p className='font-medium text-neutral-100'>{order.user?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className='bg-neutral-900 text-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <h2 className='text-lg font-bold text-neutral-300 mb-4'>Shipping Address</h2>
              <div className='space-y-2'>
                <p className='font-medium text-neutral-200'>{order.shippingAddress.fullName}</p>
                <p className='text-neutral-100'>{order.shippingAddress.phone}</p>
                <p className='text-neutral-100'>
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                </p>
                <p className='text-neutral-100'>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
                <p className='text-neutral-100'>{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className='bg-neutral-900 text-white rounded-xl border border-gray-200 shadow-sm p-6'>
            <h2 className='text-lg font-bold text-neutral-300 mb-4'>Order Details</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-neutral-100'>Razorpay Order ID</p>
                <p className='font-mono text-sm font-medium text-neutral-200'>{order.razorpayOrderId}</p>
              </div>
              <div>
                <p className='text-sm text-neutral-100'>Razorpay Payment ID</p>
                <p className='font-mono text-sm font-medium text-neutral-200'>{order.razorpayPaymentId || 'N/A'}</p>
              </div>
              <div>
                <p className='text-sm text-neutral-100'>Payment Method</p>
                <p className='font-medium text-neutral-200 capitalize'>{order.paymentMethod || 'N/A'}</p>
              </div>
              <div>
                <p className='text-sm text-neutral-100'>Order Date</p>
                <p className='font-medium text-neutral-200'>{new Date((order as any).createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Status Management */}
          <div className='bg-neutral-900 text-white rounded-xl border border-gray-200 shadow-sm p-6'>
            <h2 className='text-lg font-bold text-neutral-300 mb-4'>Status Management</h2>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-neutral-100'>Payment Status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(event) =>
                    setOrder({ ...order, paymentStatus: event.target.value as Order['paymentStatus'] })
                  }
                  className='w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary'
                >
                  <option value='created'>Created</option>
                  <option value='pending'>Pending</option>
                  <option value='paid'>Paid</option>
                  <option value='failed'>Failed</option>
                  <option value='refunded'>Refunded</option>
                </select>
              </div>

              <div>
                <label className='text-sm font-medium text-neutral-100'>Order Status</label>
                <select
                  value={order.orderStatus}
                  onChange={(event) =>
                    setOrder({ ...order, orderStatus: event.target.value as Order['orderStatus'] })
                  }
                  className='w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary'
                >
                  <option value='processing'>Processing</option>
                  <option value='confirmed'>Confirmed</option>
                  <option value='shipped'>Shipped</option>
                  <option value='delivered'>Delivered</option>
                  <option value='cancelled'>Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tracking Information */}
          <div className='bg-neutral-900 text-white rounded-xl border border-gray-200 shadow-sm p-6'>
            <h2 className='text-lg font-bold text-neutral-300 mb-4'>Tracking Information</h2>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-neutral-100'>Tracking Number</label>
                <input
                  type='text'
                  value={order.trackingNumber || ''}
                  onChange={(event) => setOrder({ ...order, trackingNumber: event.target.value })}
                  placeholder='Enter tracking number'
                  className='w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary'
                />
              </div>

              <div>
                <label className='text-sm font-medium text-neutral-100'>Estimated Delivery</label>
                <input
                  type='date'
                  value={order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : ''}
                  onChange={(event) => setOrder({ ...order, estimatedDelivery: event.target.value })}
                  className='w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary'
                />
              </div>
            </div>
          </div>

          {/* Admin Remarks */}
          <div className='bg-neutral-900 text-white rounded-xl border border-gray-200 shadow-sm p-6'>
            <h2 className='text-lg font-bold text-neutral-300 mb-4'>Admin Remarks</h2>
            <textarea
              value={order.adminRemarks || ''}
              onChange={(event) => setOrder({ ...order, adminRemarks: event.target.value })}
              placeholder='Add any notes or remarks about this order...'
              rows={4}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary resize-none'
            />
          </div>

          {/* Price Summary */}
          <div className='bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6'>
            <h2 className='text-lg font-bold text-neutral-300 mb-4'>Price Summary</h2>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-neutral-100'>Subtotal</span>
                <span className='font-medium'>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount && (
                <div className='flex justify-between'>
                  <span className='text-neutral-100'>Discount</span>
                  <span className='font-medium text-green-600'>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className='flex justify-between text-lg font-bold pt-2 border-t border-gray-300'>
                <span>Total</span>
                <span className='text-primary'>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveOrder}
            disabled={saving}
            className='w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? (
              <div className='flex items-center justify-center gap-2'>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Updates'
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsPage
