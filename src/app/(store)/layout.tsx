import AnnouncementBar from '@/components/store/AnnouncementBar'
import Navbar from '@/components/store/Navbar'
import Footer from '@/components/ui/Footer'
import React from 'react'

const ProductPageLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <div className='bg-background flex flex-col items-start justify-start overflow-hidden w-full'>
        <AnnouncementBar />
        <Navbar />
        {children}
        <Footer />
    </div>
  )
}

export default ProductPageLayout