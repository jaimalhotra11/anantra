'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Unable to process request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center w-full mx-auto px-4 py-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center mb-4'>
            <img src='/logo.png' alt='Anantra Fashion' className='w-auto h-16' />
          </div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>Forgot Password</h1>
          <p className='text-muted-foreground'>Enter your email address and we'll send you a reset link.</p>
        </div>

        <div className='bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl p-8'>
          {success ? (
            <div className='text-center space-y-4'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full'>
                <Mail className='h-8 w-8 text-green-600' />
              </div>
              <h2 className='text-xl font-semibold text-foreground'>Check your email</h2>
              <p className='text-muted-foreground text-sm'>
                If an account with <strong>{email}</strong> exists, we've sent a password reset link. Check your inbox (and spam folder).
              </p>
              <Link
                href='/auth/sign-in'
                className='inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors'
              >
                <ArrowLeft className='h-4 w-4' />
                Back to Sign in
              </Link>
            </div>
          ) : (
            <form className='space-y-4' onSubmit={handleSubmit}>
              <div>
                <label className='text-sm font-medium text-foreground block mb-2'>Email Address</label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50'
                  placeholder='Enter your email'
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className='bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              <button
                type='submit'
                disabled={loading}
                className='w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl'
              >
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className='text-center mt-4'>
                <Link
                  href='/auth/sign-in'
                  className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                  <ArrowLeft className='h-3 w-3' />
                  Back to Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
