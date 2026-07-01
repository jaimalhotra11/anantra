import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/db'
import UserModel from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json()

    if (!token || !email || !password) {
      return NextResponse.json({ success: false, error: 'Token, email and new password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetTokenExpiry')

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired reset link' }, { status: 400 })
    }

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetTokenExpiry = undefined
    await user.save()

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reset password' }, { status: 500 })
  }
}
