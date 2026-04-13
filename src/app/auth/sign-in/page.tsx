'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'

const SignInPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/account'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const response = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (response?.error) {
        setError('Invalid credentials or unverified account')
        return
      }

      router.push(callbackUrl)
    } catch {
      setError('Unable to sign in')
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
          <h1 className='text-3xl font-bold text-foreground mb-2'>Welcome Back</h1>
          <p className='text-muted-foreground'>Sign in to access your account and continue your fashion journey</p>
        </div>

        {/* Sign In Form */}
        <div className='bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl p-8'>

          <form className='space-y-4' onSubmit={handleSubmit}>
            <div>
              <label className='text-sm font-medium text-foreground block mb-2'>Email Address</label>
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
              <label className='text-sm font-medium text-foreground block mb-2'>Password</label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className='w-full px-4 py-3 pr-12 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/50'
                  placeholder='Enter your password'
                  required
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  disabled={loading}
                >
                  {showPassword ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
                </button>
              </div>
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
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className='text-center mt-6 text-sm text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link
              href='/auth/sign-up'
              className='text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors'
            >
              Create one
            </Link>
          </div>

          {/* Additional Links */}
          <div className='text-center mt-4'>
            <Link
              href='/auth/forgot-password'
              className='text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignInPage
