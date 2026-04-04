'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order {
  _id: string
  totalAmount: number
  subtotal: number
  discount?: number
  paymentStatus: 'created' | 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  razorpayOrderId: string
  razorpayPaymentId?: string
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
    <div className='max-w-3xl space-y-5'>
      <h1 className='text-3xl font-bold'>Order #{order._id.slice(-6)}</h1>
      {error && <p className='text-red-600 text-sm'>{error}</p>}

      <div className='border rounded-lg p-4 space-y-3'>
        <p><span className='font-medium'>Customer:</span> {order.user?.fullName} ({order.user?.email})</p>
        <p><span className='font-medium'>Razorpay Order ID:</span> {order.razorpayOrderId}</p>
        <p><span className='font-medium'>Razorpay Payment ID:</span> {order.razorpayPaymentId || 'N/A'}</p>
        <p><span className='font-medium'>Subtotal:</span> ₹{order.subtotal.toFixed(2)}</p>
        <p><span className='font-medium'>Discount:</span> ₹{(order.discount || 0).toFixed(2)}</p>
        <p><span className='font-medium'>Total:</span> ₹{order.totalAmount.toFixed(2)}</p>
      </div>

      <div className='border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='text-sm font-medium'>Payment Status</label>
          <select
            value={order.paymentStatus}
            onChange={(event) =>
              setOrder({ ...order, paymentStatus: event.target.value as Order['paymentStatus'] })
            }
            className='w-full mt-1 border rounded-md px-3 py-2'
          >
            <option value='created'>Created</option>
            <option value='pending'>Pending</option>
            <option value='paid'>Paid</option>
            <option value='failed'>Failed</option>
            <option value='refunded'>Refunded</option>
          </select>
        </div>

        <div>
          <label className='text-sm font-medium'>Order Status</label>
          <select
            value={order.orderStatus}
            onChange={(event) =>
              setOrder({ ...order, orderStatus: event.target.value as Order['orderStatus'] })
            }
            className='w-full mt-1 border rounded-md px-3 py-2'
          >
            <option value='processing'>Processing</option>
            <option value='confirmed'>Confirmed</option>
            <option value='shipped'>Shipped</option>
            <option value='delivered'>Delivered</option>
            <option value='cancelled'>Cancelled</option>
          </select>
        </div>
      </div>

      <div className='border rounded-lg p-4'>
        <h2 className='text-lg font-semibold mb-2'>Shipping Address</h2>
        <p>{order.shippingAddress.fullName}</p>
        <p>{order.shippingAddress.phone}</p>
        <p>
          {order.shippingAddress.addressLine1}
          {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
        </p>
        <p>
          {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.country} - {order.shippingAddress.postalCode}
        </p>
      </div>

      <button
        onClick={saveOrder}
        disabled={saving}
        className='px-4 py-2 bg-primary text-white rounded-md disabled:opacity-60'
      >
        {saving ? 'Saving...' : 'Save Updates'}
      </button>
    </div>
  )
}

export default OrderDetailsPage
