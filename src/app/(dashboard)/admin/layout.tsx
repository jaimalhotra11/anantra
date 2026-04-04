"use client"
import AppSidebar from '@/components/AppSidebar'
import Navbar from '@/components/AdminNavbar'
import { Toaster } from '@/components/ui/sonner'
import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import './admin-globals.css'

const AdminDashboardLayout = ({children}: {children: React.ReactNode}) => {
  const { data: session } = useSession()
  const router = useRouter()

  // useEffect(() => {
  //   if (!session) {
  //     router.push('/login')
  //   }
  //   if(session?.user.role !== 'admin') {
  //     router.push('/unauthorized')
  //   }
  // }, [session])
  
  return (
    <div className="flex w-full">
      <Toaster position="top-center" />
        <AppSidebar />
        <main className="flex-1 w-full">
            <Navbar />
            <div className="px-4 py-6">{children}</div>
        </main>
    </div>
  )
}

export default AdminDashboardLayout