'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

const SignUpPage = () => {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, email, password }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sign up')
      }

      setOtpStep(true)
      setMessage('Account created. Enter OTP to verify your email.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      const response = await fetch('/api/auth/sign-up', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify OTP')
      }

      setMessage('Email verified successfully. Redirecting to sign in...')
      setTimeout(() => router.push('/auth/sign-in'), 800)
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center w-full mx-auto px-4 py-4 sm:mt-0 -mt-16'>
      <div className='w-full max-w-md'>
        {/* Logo/Brand Section */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center mb-4'>
            <img src="/logo.png" alt="Anantra Fashion" className='w-auto h-16' />
          </div>
          <h1 className='text-3xl font-bold text-foreground mb-1'>Create Account</h1>
          <p className='text-muted-foreground'>Join Anantra Fashion and start your style journey</p>
        </div>
        <div className='bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl p-8'>
          {!otpStep ? (
            <form className='space-y-4' onSubmit={handleRegister}>
              <div>
                <label className='text-sm font-medium text-foreground block mb-1'>Full Name</label>
                <input
                  placeholder='Full name'
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className='w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50'
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className='text-sm font-medium text-foreground block mb-1'>Phone</label>
                <input
                  placeholder='Phone'
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className='w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50'
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className='text-sm font-medium text-foreground block mb-1'>Email Address</label>
                <input
                  type='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className='w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50'
                  placeholder='Enter your email'
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className='text-sm font-medium text-foreground block mb-1'>Password</label>
                <input
                  type='password'
                  placeholder='Password (min 8 chars)'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className='w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50'
                  minLength={8}
                  required
                  disabled={loading}
                />
                
              </div>
              <button type='submit' disabled={loading} className='w-full py-2.5 bg-primary text-white rounded-md disabled:opacity-60'>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          ) : (
            <form className='space-y-4' onSubmit={handleVerifyOtp}>
              <input
                placeholder='Enter OTP'
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className='w-full border border-border rounded-md px-3 py-2 bg-background'
                required
              />
              <button type='submit' disabled={loading} className='w-full py-2.5 bg-primary text-white rounded-md disabled:opacity-60'>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}
        </div>

        {message && <p className='text-sm text-green-700 mt-4'>{message}</p>}
        {error && <p className='text-sm text-red-600 mt-4'>{error}</p>}

        <p className='text-sm text-muted-foreground mt-4'>
          Already registered?{' '}
          <Link href='/auth/sign-in' className='text-primary underline'>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignUpPage
