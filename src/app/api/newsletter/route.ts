import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend'
import Newsletter from '@/models/Newsletter'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 })
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!)
    }

    await Newsletter.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $setOnInsert: { email: email.toLowerCase().trim() }, $set: { status: 'subscribed' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    await sendEmail({
      to: email,
      subject: 'Welcome to Anantra Fashion Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #5F613A; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Anantra Fashion</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Thank you for subscribing!</h2>
            <p style="color: #666; line-height: 1.6;">
              You've successfully subscribed to the Anantra Fashion newsletter. You'll be the first to know about our latest offers, new arrivals, and exclusive deals.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.anantara.in'}"
                 style="background-color: #5F613A; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Shop Now
              </a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't subscribe, please ignore this email.
            </p>
          </div>
          <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>&copy; 2026 Anantra Fashion. All rights reserved.</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Subscribed successfully' })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json({ success: false, error: 'Failed to subscribe' }, { status: 500 })
  }
}
