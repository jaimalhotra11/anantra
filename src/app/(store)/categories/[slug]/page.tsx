'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import { toProductCardItem, type ProductListItem } from '@/lib/storefront'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
}

const CategoryDetailsPage = () => {
  const params = useParams()
  const slug = params.slug as string

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const fetchCategoryWithProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const categoryResponse = await fetch(`/api/categories/${slug}`)
        const categoryResult = await categoryResponse.json()

        if (!categoryResult.success) {
          throw new Error(categoryResult.error || 'Category not found')
        }

        setCategory(categoryResult.data)

        const productsResponse = await fetch(`/api/products?category=${categoryResult.data._id}&limit=40`)
        const productsResult = await productsResponse.json()

        if (!productsResult.success) {
          throw new Error(productsResult.error || 'Failed to fetch products')
        }

        setProducts(productsResult.data)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load category')
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryWithProducts()
  }, [slug])

  const productCards = useMemo(() => products.map(toProductCardItem), [products])

  if (loading) {
    return <div className='px-4 md:px-8 lg:px-16 py-10'>Loading category...</div>
  }

  if (error || !category) {
    return <div className='px-4 md:px-8 lg:px-16 py-10 text-red-600'>{error || 'Category not found'}</div>
  }

  return (
    <div className='px-4 md:px-8 lg:px-16 py-10'>
      <h1 className='text-3xl font-bold text-primary'>{category.name}</h1>
      <p className='text-muted-foreground mt-2 mb-8'>{category.description || 'Category products'}</p>

      {productCards.length === 0 ? (
        <p className='text-muted-foreground'>No published products in this category yet.</p>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8'>
          {productCards.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoryDetailsPage
