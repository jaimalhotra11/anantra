'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/categories?limit=100')
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to load categories')
        }

        setCategories(result.data)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return <div className='px-4 md:px-8 lg:px-16 py-10'>Loading categories...</div>
  }

  if (error) {
    return <div className='px-4 md:px-8 lg:px-16 py-10 text-red-600'>{error}</div>
  }

  return (
    <div className='px-4 md:px-8 lg:px-16 py-10'>
      <h1 className='text-3xl font-bold text-primary mb-2'>Browse Categories</h1>
      <p className='text-muted-foreground mb-8'>Explore products by category.</p>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/categories/${category.slug}`}
            className='rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors'
          >
            <h2 className='text-lg font-semibold text-primary'>{category.name}</h2>
            <p className='text-sm text-muted-foreground mt-1 line-clamp-3'>
              {category.description || 'Explore products in this category.'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default CategoriesPage
