'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import Link from 'next/link'
import { Heart, Eye, ShoppingCart, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { addGuestCartItem, setPendingCartItem } from '@/lib/storefront'
import { toast } from 'sonner'

interface ProductCardProps {
  product: {
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
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { data: session } = useSession()

  const handleQuickAdd = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (isAddingToCart) return

    setIsAddingToCart(true)

    try {
      if (!session?.user) {
        // Store the item to be added after login and redirect to login
        setPendingCartItem({
          productId: product.id,
          quantity: 1,
          productName: product.name,
          productSlug: product.slug,
          redirectPath: window.location.pathname,
        })
        
        toast.info('Please sign in to add items to your cart')
        
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/auth/sign-in'
        }, 1000)
        
        return
      }

      // Handle authenticated user cart
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to cart')
      }

      toast.success(data.message || `${product.name} added to cart!`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add item to cart')
    } finally {
      if (session?.user) {
        setIsAddingToCart(false)
      }
    }
  }

  return (
    <div
      className='group mx-auto w-[280px] md:w-[250px] lg:w-[250px] relative rounded-lg overflow-hidden bg-background transition-all duration-300'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`}>
        <div className='relative h-72 sm:h-80 flex items-center justify-center overflow-hidden'>
          {/* Discount Badge */}
          {/* {product.discount && (
            <span className='absolute top-3 left-3 text-neutral-800 text-xs font-semibold px-3 py-1 rounded-full z-10 shadow-sm'>
              -{product.discount}%
            </span>
          )} */}

          {/* Product Image */}
          <img
            src={isHovered && product.hoverImage ? product.hoverImage : product.mainImage}
            alt={product.name}
            style={{ objectFit: 'cover' }}
            className='transition-all h-full w-full object-cover duration-500 ease-out'
          />

          {/* Action Buttons - Appear on Hover */}
          <div className={`absolute top-3 right-3 flex flex-col space-y-2 transition-all duration-300 z-10 ${isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
            <button className='p-2 bg-white rounded-full shadow-md hover:bg-neutral-100 transition-all duration-300 hover:scale-110'>
              <Heart className='h-4 w-4 text-neutral-600 hover:text-red-500' />
            </button>
            <button className='p-2 bg-white rounded-full shadow-md hover:bg-neutral-100 transition-all duration-300 hover:scale-110'>
              <Eye className='h-4 w-4 text-neutral-600' />
            </button>
          </div>

          {/* Quick Add Button - Appears on Hover */}
          <button
            onClick={handleQuickAdd}
            disabled={isAddingToCart}
            className={`absolute text-white cursor-pointer bottom-0 left-0 right-0 bg-(--brand-primary) font-bold py-3 px-4 transition-all duration-300 ease-out z-10 flex items-center justify-center space-x-2 ${isHovered ? 'translate-y-0' : 'translate-y-full'
              } ${isAddingToCart ? 'opacity-90 cursor-not-allowed' : ''}`}
          >
            {isAddingToCart ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='text-sm text-white font-medium'>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart className='h-4 w-4' />
                <span className='text-sm text-white font-medium'>Quick Add</span>
              </>
            )}
          </button>
        </div>

        {/* Product Info */}
        <div className='p-4 space-y-3'>
          {/* Product Name */}
          <h3 className={`text-sm font-medium line-clamp-2 transition-colors duration-300 ${isHovered ? 'text-brand-primary' : 'text-neutral-800'
            }`}>
            {product.name}
          </h3>

          {/* Rating - supports decimal values with half-star rendering */}
          <div className='flex items-center space-x-1'>
            {new Array(5).fill(0).map((_, index) => {
              const fill = Math.min(Math.max(product.rating - index, 0), 1) // clamp to 0–1 per star
              const uniqueId = `half-star-${product.id}-${index}`
              return (
                <svg
                  key={index}
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  className='h-4 w-4'
                  strokeWidth={1.5}
                  stroke='#f6e05e'
                >
                  <defs>
                    <linearGradient id={uniqueId}>
                      <stop offset={`${fill * 100}%`} stopColor='#f6e05e' />
                      <stop offset={`${fill * 100}%`} stopColor='transparent' />
                    </linearGradient>
                  </defs>
                  <polygon
                    points='12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26'
                    fill={`url(#${uniqueId})`}
                    stroke='#f6e05e'
                  />
                </svg>
              )
            })}
          </div>

          {/* Price */}
          <div className='flex items-center space-x-2'>
            <span className='text-md font-semibold text-neutral-900'>
              Rs. {product.price.toLocaleString('en-IN')}.00
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default ProductCard
