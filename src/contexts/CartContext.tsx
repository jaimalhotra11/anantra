'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface CartItem {
  productId: string
  variantId?: string
  quantity: number
  priceAtTime: number
  total: number
  product?: {
    id: string
    title: string
    slug: string
    image: string
    variantAttributes: any[]
  }
}

interface CartData {
  _id: string
  userId: string
  items: CartItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}

interface CartContextType {
  cart: CartData | null
  itemCount: number
  isLoading: boolean
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()

  const refreshCart = async () => {
    if (!session?.user) {
      setCart(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/cart')
      const result = await response.json()
      
      if (result.success) {
        setCart(result.data)
      } else {
        console.error('Failed to fetch cart:', result.error)
        setCart(null)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      setCart(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshCart()
  }, [session])

  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0

  const value: CartContextType = {
    cart,
    itemCount,
    isLoading,
    refreshCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
