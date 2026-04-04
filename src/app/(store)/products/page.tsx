'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ui/ProductCard'
import { toProductCardItem, type ProductListItem } from '@/lib/storefront'

interface CategoryOption {
  _id: string
  name: string
  slug: string
}

const ProductsPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = searchParams.get('q') || ''
  const categoryFilter = searchParams.get('category') || 'all'
  const page = searchParams.get('page') || '1'

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (!value || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    if (key !== 'page') {
      params.delete('page')
    }

    router.push(`/products?${params.toString()}`)
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?limit=100')
        const result = await response.json()
        if (result.success) {
          setCategories(result.data)
        }
      } catch (fetchError) {
        console.error('Failed to load categories:', fetchError)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page,
          limit: '12',
        })

        if (categoryFilter !== 'all') {
          params.set('category', categoryFilter)
        }

        if (query) {
          params.set('q', query)
          const response = await fetch(`/api/products/search?${params.toString()}`)
          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error || 'Failed to search products')
          }

          setProducts(result.data)
        } else {
          const response = await fetch(`/api/products?${params.toString()}`)
          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error || 'Failed to load products')
          }

          setProducts(result.data)
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [query, categoryFilter, page])

  const productCards = useMemo(() => products.map(toProductCardItem), [products])

  return (
    <div className='w-full px-4 md:px-8 lg:px-16 py-8 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-primary'>Shop Products</h1>
        <p className='text-muted-foreground mt-1'>Find the perfect fit for your style.</p>
      </div>

      <div className='flex flex-col md:flex-row gap-4 md:items-center'>
        <input
          value={query}
          onChange={(event) => updateSearchParams('q', event.target.value)}
          placeholder='Search products...'
          className='w-full md:w-96 border border-border rounded-md px-3 py-2 bg-card'
        />

        <select
          value={categoryFilter}
          onChange={(event) => updateSearchParams('category', event.target.value)}
          className='w-full md:w-64 border border-border rounded-md px-3 py-2 bg-card'
        >
          <option value='all'>All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className='text-muted-foreground'>Loading products...</p>}
      {error && <p className='text-red-600'>{error}</p>}

      {!loading && !error && productCards.length === 0 && (
        <p className='text-muted-foreground'>No products found for your current filters.</p>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {productCards.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default ProductsPage
