import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/db'
import UserModel from '@/models/User'
import { sendEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    await connectDB()

    const user = await UserModel.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Return success to avoid email enumeration
      return NextResponse.json({ success: true, message: 'If this email exists, a reset link has been sent.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    user.passwordResetToken = hashedToken
    user.passwordResetTokenExpiry = expiry
    await user.save()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.anantara.in'
    const resetLink = `${siteUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    await sendEmail({
      to: email,
      subject: 'Reset Your Password - Anantra Fashion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #5F613A; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Anantra Fashion</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6;">
              Hi ${user.fullName}, we received a request to reset your password. Click the button below to proceed.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}"
                 style="background-color: #5F613A; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
          <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>&copy; 2026 Anantra Fashion. All rights reserved.</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'If this email exists, a reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 })
  }
}
