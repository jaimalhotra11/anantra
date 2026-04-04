import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' },
      { status: 401 }
    )
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  return null // No error, user is admin
}

export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}
