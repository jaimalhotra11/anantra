import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import UserModel from '@/models/User';

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

    // Log OTP for development (in production, send via email/SMS)
    console.log(`OTP for ${email}: ${otp}`); // Remove this in production
    
    // For demo purposes, we'll include the OTP in the response
    // In production, remove this and send via email/SMS
    return NextResponse.json({
      message: 'User created successfully. Please verify your email with the OTP sent.',
      otp: otp, // Remove this in production
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

    // Log OTP for development (in production, send via email/SMS)
    console.log(`New OTP for ${email}: ${otp}`); // Remove this in production

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
