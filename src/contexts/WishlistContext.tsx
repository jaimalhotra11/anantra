'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface WishlistContextType {
  productIds: string[]
  isLoading: boolean
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<{ success: boolean; added?: boolean; error?: string }>
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

interface WishlistProviderProps {
  children: ReactNode
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const [productIds, setProductIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()

  const refreshWishlist = async () => {
    if (!session?.user) {
      setProductIds([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/wishlist')
      const result = await response.json()

      if (result.success) {
        setProductIds(result.data.productIds)
      } else {
        console.error('Failed to fetch wishlist:', result.error)
        setProductIds([])
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      setProductIds([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshWishlist()
  }, [session])

  const isInWishlist = (productId: string) => productIds.includes(productId)

  const toggleWishlist = async (productId: string) => {
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      const result = await response.json()
      if (!result.success) {
        return { success: false, error: result.error || 'Failed to update wishlist' }
      }

      setProductIds(result.data.productIds)
      return { success: true, added: result.data.added }
    } catch (error) {
      console.error('Error updating wishlist:', error)
      return { success: false, error: 'Failed to update wishlist' }
    }
  }

  const value: WishlistContextType = {
    productIds,
    isLoading,
    isInWishlist,
    toggleWishlist,
    refreshWishlist,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
