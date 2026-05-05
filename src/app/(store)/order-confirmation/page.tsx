'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, Package, Truck, CreditCard, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

type OrderStatus = 'success' | 'failed' | 'pending' | 'processing'

interface OrderConfirmationData {
  orderId: string
  status?: string
  message?: string
  total?: number
  paymentMethod?: string
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const [orderData, setOrderData] = useState<OrderConfirmationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get order data from URL params or localStorage
    const status: OrderStatus = (searchParams.get('status') as OrderStatus) || 'pending'
    const orderId = searchParams.get('orderId') || ''
    const message = searchParams.get('message') || ''
    const total = searchParams.get('total') || '0'
    const paymentMethod = searchParams.get('paymentMethod') || ''

    setOrderData({
      orderId,
      status,
      message,
      total: parseFloat(total),
      paymentMethod
    })
    setLoading(false)
  }, [searchParams])

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Order Confirmed!',
          subtitle: 'Thank you for your purchase',
          description: 'Your order has been successfully placed and is being processed.'
        }
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Order Failed',
          subtitle: 'We couldn\'t process your order',
          description: 'There was an issue processing your order. Please try again or contact support.'
        }
      case 'processing':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Processing Order',
          subtitle: 'Your order is being processed',
          description: 'We\'re currently processing your order. You will receive a confirmation email shortly.'
        }
      default:
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Order Pending',
          subtitle: 'Your order is pending',
          description: 'Your order is pending confirmation. Please check back later for updates.'
        }
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen w-full flex items-center justify-center'>
        <Loader2 className='animate-spin text-primary h-12 w-12' />
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Order Not Found</h1>
          <p className='text-gray-600'>We couldn't find your order information.</p>
          <Link href='/' className='text-primary hover:text-primary/80 mt-4 inline-block'>
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(orderData.status as OrderStatus)
  const Icon = statusConfig.icon

  return (
    <div className='min-h-screen w-full flex items-center justify-center flex-col'>


      {/* Main Content */}
      <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='max-w-screen-2xl mx-auto'>
          {/* Status Card */}
          <div className={`rounded-2xl shadow-lg border ${statusConfig.borderColor} ${statusConfig.bgColor} overflow-hidden mb-8`}>
            <div className='p-8 text-center'>
              <div className={`w-20 h-20 ${statusConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <Icon className={`w-10 h-10 ${statusConfig.color}`} />
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${statusConfig.color}`}>
                {statusConfig.title}
              </h1>
              <p className='text-lg text-gray-600 mb-4'>{statusConfig.subtitle}</p>
              <p className='text-gray-700 max-w-md mx-auto'>{statusConfig.description}</p>
              
              {orderData.orderId && (
                <div className='mt-6 p-4 bg-white rounded-xl border border-gray-200'>
                  <p className='text-sm text-gray-600 mb-1'>Order Number</p>
                  <p className='font-mono font-bold text-lg text-gray-900'>#{orderData.orderId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          {orderData.status === 'success' && orderData.total && (
            <div className='bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8'>
              <h2 className='text-xl font-bold text-gray-900 mb-6'>Order Details</h2>
              
              <div className='space-y-4'>
                <div className='flex justify-between items-center py-3 border-b border-gray-100'>
                  <span className='text-gray-600'>Payment Method</span>
                  <div className='flex items-center gap-2'>
                    {orderData.paymentMethod === 'razorpay' ? (
                      <>
                        <CreditCard className='w-5 h-5 text-primary' />
                        <span className='font-medium'>Online Payment</span>
                      </>
                    ) : (
                      <>
                        <Truck className='w-5 h-5 text-primary' />
                        <span className='font-medium'>Cash on Delivery</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className='flex justify-between items-center py-3 border-b border-gray-100'>
                  <span className='text-gray-600'>Total Amount</span>
                  <span className='text-xl font-bold text-primary'>₹{orderData.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/account'
              className='px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors text-center'
            >
              View My Orders
            </Link>
            <Link
              href='/products'
              className='px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center'
            >
              Continue Shopping
            </Link>
          </div>

          {/* Support Section */}
          {orderData.status === 'failed' && (
            <div className='mt-8 text-center'>
              <p className='text-gray-600 mb-4'>Need help? Contact our support team</p>
              <Link
                href='/contact'
                className='text-primary hover:text-primary/80 font-medium'
              >
                Contact Support
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
