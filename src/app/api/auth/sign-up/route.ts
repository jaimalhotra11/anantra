import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import UserModel from '@/models/User';
import { sendEmail } from '@/lib/resend';

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number; email: string }>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone } = await request.json();

    // Validate input
    if (!email || !password || !fullName || !phone) {
      return NextResponse.json(
        { error: 'Email, password, full name, and phone are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate OTP and set expiry (5 minutes)
    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // Store OTP (in production, use Redis or database)
    otpStore.set(email, { otp, expires, email });

    // Create user with isVerified set to false
    const user = new UserModel({
      email,
      password,
      fullName,
      phone,
      isVerified: false,
      role: 'user', // Default role
    });

    await user.save();

    // Send OTP via email
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #5F613A 0%, #7A7C4F 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Email Verification</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Verify your email address</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 15px;">Your Verification Code</h2>
            <div style="background: #fff; padding: 20px; border: 2px dashed #5F613A; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #5F613A; letter-spacing: 3px; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666; line-height: 1.6; margin-top: 20px;">
              Enter this 6-digit code to verify your email address. This code will expire in 5 minutes.
            </p>
          </div>
          
          <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">Account Details</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${fullName}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">Welcome to Anantra Fashion!</p>
            <p style="color: #666; font-size: 12px; margin-top: 10px;">If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      `
      
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - Anantra Fashion',
        html: emailHtml,
      })
      
      console.log('OTP email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      // Continue with user creation even if email fails
    }
    
    return NextResponse.json({
      message: 'User created successfully. Please verify your email with the OTP sent.',
      userId: user._id,
      requiresVerification: true
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify OTP endpoint
export async function PUT(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Check OTP in store
    const storedOTP = otpStore.get(email);
    if (!storedOTP) {
      return NextResponse.json(
        { error: 'OTP not found or expired' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (Date.now() > storedOTP.expires) {
      otpStore.delete(email);
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Update user verification status
    const user = await UserModel.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Clean up OTP from store
    otpStore.delete(email);

    return NextResponse.json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        role: user.role
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Resend OTP endpoint
export async function PATCH(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // Store new OTP
    otpStore.set(email, { otp, expires, email });

    // Send new OTP via email
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #5F613A 0%, #7A7C4F 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">New Verification Code</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Here's your new OTP</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 15px;">Your New Verification Code</h2>
            <div style="background: #fff; padding: 20px; border: 2px dashed #5F613A; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #5F613A; letter-spacing: 3px; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666; line-height: 1.6; margin-top: 20px;">
              Enter this 6-digit code to verify your email address. This code will expire in 5 minutes.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">Anantra Fashion Support</p>
            <p style="color: #666; font-size: 12px; margin-top: 10px;">If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `
      
      await sendEmail({
        to: email,
        subject: 'New Verification Code - Anantra Fashion',
        html: emailHtml,
      })
      
      console.log('New OTP email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send new OTP email:', emailError)
      // Continue with response even if email fails
    }

    return NextResponse.json({
      message: 'New OTP sent successfully',
      otp: otp // Remove this in production
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
