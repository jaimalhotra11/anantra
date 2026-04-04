'use client'

import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, Pagination } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '../ui/ProductCard'
import Link from 'next/link'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface FeaturedProduct {
    id: string
    name: string
    price: number
    slug: string
    rating: number
    salePrice?: number
    discount?: number
    mainImage: string
    hoverImage: string
}

interface FeaturedProductCardSliderProps {
    products: FeaturedProduct[]
    title?: string
    description?: string
    collectionSlug?: string
    autoplay?: boolean
    autoplaySpeed?: number
    showDots?: boolean
    showArrows?: boolean
    className?: string
}

const FeaturedProductCardSlider: React.FC<FeaturedProductCardSliderProps> = ({
    products,
    title,
    description,
    collectionSlug,
    autoplay = false,
    autoplaySpeed = 3000,
    showDots = true,
    showArrows = true,
    className = ''
}) => {
    if (!products || products.length === 0) {
        return null
    }

    return (
        <div className={`w-full ${className} pt-10`}>
            {/* Title */}
            {title && (
                <div className='mb-6'>
                    <h2 className='text-3xl text-center font-serif font-bold text-neutral-800'>{title}</h2>
                    <p className='text-center text-neutral-600'>{description}</p>
                </div>
            )}

            {/* Swiper Container */}
            <div className='relative group'>
                <Swiper
                    modules={[Navigation, Autoplay, Pagination]}
                    spaceBetween={16}
                    slidesPerView={1}
                    breakpoints={{
                        640: {
                            slidesPerView: 2,
                            spaceBetween: 16
                        },
                        768: {
                            slidesPerView: 3,
                            spaceBetween: 16
                        },
                        1024: {
                            slidesPerView: 4,
                            spaceBetween: 16
                        }
                    }}
                    autoplay={autoplay ? {
                        delay: autoplaySpeed,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true
                    } : false}
                    pagination={showDots ? {
                        clickable: true,
                        dynamicBullets: true,
                        el: '.swiper-pagination'
                    } : false}
                    navigation={{
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    }}
                    className='!pb-12'
                >
                    {products.map((product) => (
                        <SwiperSlide key={product.id} className='flex justify-center'>
                            <ProductCard product={product} />
                        </SwiperSlide>
                    ))}
                    
                    {collectionSlug && (
                        <SwiperSlide className='flex justify-center'>
                            <Link href={`/products?collection=${collectionSlug}`}>
                                <div className='w-full h-[95%] bg-(--brand-primary) rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group flex items-center justify-center min-h-[400px]'>
                                    <button className='text-white font-medium text-md group-hover:scale-105 transition-transform duration-300'>
                                        View All
                                    </button>
                                </div>
                            </Link>
                        </SwiperSlide>
                    )}
                </Swiper>

                {/* Custom Navigation Arrows */}
                {showArrows && products.length > 1 && (
                    <>
                        <button className='swiper-button-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-primary' aria-label='Previous products'>
                            <ChevronLeft className='h-5 w-5 text-neutral-900' />
                        </button>
                        <button className='swiper-button-next absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-primary' aria-label='Next products'>
                            <ChevronRight className='h-5 w-5 text-neutral-900' />
                        </button>
                    </>
                )}

                {/* Pagination Dots */}
                {showDots && products.length > 1 && (
                    <div className='swiper-pagination !bottom-0 !mt-6'></div>
                )}
            </div>
        </div>
    )
}

export default FeaturedProductCardSlider
