'use client'

import Link from 'next/link'
import { FormEvent, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'

const ResetPasswordForm = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to reset password. The link may have expired.')
      }
    } catch {
      setError('Unable to process request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className='text-center space-y-4'>
        <p className='text-destructive'>Invalid reset link. Please request a new one.</p>
        <Link href='/auth/forgot-password' className='text-primary hover:text-primary/80 underline text-sm'>
          Request new link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className='text-center space-y-4'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full'>
          <CheckCircle className='h-8 w-8 text-green-600' />
        </div>
        <h2 className='text-xl font-semibold text-foreground'>Password Reset!</h2>
        <p className='text-muted-foreground text-sm'>Your password has been reset successfully.</p>
        <Link
          href='/auth/sign-in'
          className='inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm'
        >
          Sign in with new password
        </Link>
      </div>
    )
  }

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      <div>
        <label className='text-sm font-medium text-foreground block mb-2'>New Password</label>
        <div className='relative'>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full px-4 py-3 pr-12 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50'
            placeholder='Enter new password'
            required
            disabled={loading}
            minLength={6}
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
          >
            {showPassword ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
          </button>
        </div>
      </div>

      <div>
        <label className='text-sm font-medium text-foreground block mb-2'>Confirm Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className='w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50'
          placeholder='Confirm new password'
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
        className='w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg'
      >
        {loading ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            Resetting...
          </>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  )
}

const ResetPasswordPage = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center w-full mx-auto px-4 py-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center mb-4'>
            <img src='/logo.png' alt='Anantra Fashion' className='w-auto h-16' />
          </div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>Set New Password</h1>
          <p className='text-muted-foreground'>Choose a strong password for your account.</p>
        </div>

        <div className='bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl p-8'>
          <Suspense fallback={<div className='text-center text-muted-foreground'>Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
