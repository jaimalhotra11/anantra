export async function createRazorpayOrder({
  amount,
  receipt,
}: {
  amount: number
  receipt: string
}) {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured')
  }

  const authToken = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      payment_capture: 1,
    }),
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result?.error?.description || 'Failed to create Razorpay order')
  }

  return {
    orderId: result.id as string,
    amount: result.amount as number,
    currency: result.currency as string,
    keyId,
  }
}
