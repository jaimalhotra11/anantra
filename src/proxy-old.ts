import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// This middleware protects routes based on user authentication and role
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth()
  
  // Define protected routes
  const adminRoutes = ['/admin']
  const dashboardRoutes = ['/dashboard']
  
  // Check if current path starts with admin routes
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isDashboardRoute = dashboardRoutes.some(route => pathname.startsWith(route))
  
  // Admin route protection
  if (isAdminRoute) {
    if (!session) {
      // Not authenticated - redirect to sign in
      const url = new URL('/auth', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    
    if (session.user?.role !== 'admin') {
      // Authenticated but not admin - redirect to unauthorized page or home
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  
  // Dashboard route protection
  if (isDashboardRoute) {
    if (!session) {
      // Not authenticated - redirect to sign in
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    
    if (!session.user?.isVerified) {
      // Authenticated but not verified - redirect to verification page
      return NextResponse.redirect(new URL('/auth/verify-email', request.url))
    }
  }
  
  // Allow access to public routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ],
}