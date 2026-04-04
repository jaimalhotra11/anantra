'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Order {
  _id: string
  user?: { fullName?: string; email?: string }
  totalAmount: number
  paymentStatus: string
  orderStatus: string
  razorpayOrderId: string
  createdAt: string
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        const query = new URLSearchParams()
        if (search) query.set('search', search)
        const response = await fetch(`/api/admin/orders?${query.toString()}`)
        const result = await response.json()
        if (!result.success) throw new Error(result.error || 'Failed to fetch orders')
        setOrders(result.data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to fetch orders')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [search])

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Orders</h1>
          <p className='text-muted-foreground'>Track and manage all customer orders.</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Search order/payment id'
          className='border rounded-md px-3 py-2 w-72'
        />
      </div>

      {loading && <p className='text-muted-foreground'>Loading orders...</p>}
      {error && <p className='text-red-600 text-sm'>{error}</p>}

      <div className='overflow-x-auto border rounded-lg bg-card'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50'>
            <tr>
              <th className='text-left p-3'>Order</th>
              <th className='text-left p-3'>Customer</th>
              <th className='text-left p-3'>Amount</th>
              <th className='text-left p-3'>Payment</th>
              <th className='text-left p-3'>Order Status</th>
              <th className='text-left p-3'>Created</th>
              <th className='text-left p-3'>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className='border-t'>
                <td className='p-3 font-medium'>#{order._id.slice(-6)}</td>
                <td className='p-3'>
                  {order.user?.fullName || 'N/A'}
                  <p className='text-xs text-muted-foreground'>{order.user?.email || ''}</p>
                </td>
                <td className='p-3'>₹{order.totalAmount?.toFixed(2)}</td>
                <td className='p-3 capitalize'>{order.paymentStatus}</td>
                <td className='p-3 capitalize'>{order.orderStatus}</td>
                <td className='p-3'>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className='p-3'>
                  <Link href={`/admin/orders/${order._id}`} className='text-primary underline'>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td className='p-4 text-muted-foreground' colSpan={7}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OrdersPage
