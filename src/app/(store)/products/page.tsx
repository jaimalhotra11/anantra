'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ui/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toProductCardItem, type ProductListItem } from '@/lib/storefront'
import { ArrowLeft, Filter, Loader2 } from 'lucide-react'

interface CategoryOption {
  _id: string
  name: string
  slug: string
}

interface FilterState {
  priceRange: [number, number]
  colors: { name: string, hex: string, value: string }[]
  sizes: string[]
  categories: string[]
}

const COLORS = [

  { name: "Black", value: "Black", hex: "#000000" },
  { name: "White", value: "White", hex: "#FFFFFF" },
  { name: "Red", value: "Red", hex: "#FF0000" },
  { name: "Blue", value: "Blue", hex: "#0000FF" },
  { name: "Green", value: "Green", hex: "#00FF00" },
  { name: "Yellow", value: "Yellow", hex: "#FFFF00" },
  { name: "Orange", value: "Orange", hex: "#FFA500" },
  { name: "Purple", value: "Purple", hex: "#800080" },
  { name: "Pink", value: "Pink", hex: "#FFC0CB" },
  { name: "Brown", value: "Brown", hex: "#964B00" },
  { name: "Gray", value: "Gray", hex: "#808080" },
  { name: "Navy", value: "Navy", hex: "#000080" },
  { name: "Maroon", value: "Maroon", hex: "#800000" },
  { name: "Teal", value: "Teal", hex: "#008080" },
  { name: "Beige", value: "Beige", hex: "#F5F5DC" },
]

const SIZES = ["XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "XXXXL"]

const ProductsPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 5000],
    colors: [],
    sizes: [],
    categories: [],
  })
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
    setDebouncedSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

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

  const handleFilterChange = (filterType: keyof FilterState, value: string | [number, number]) => {
    setFilters(prev => {
      if (filterType === 'priceRange') {
        return { ...prev, [filterType]: value as [number, number] }
      }

      const currentValues = prev[filterType] as string[]
      if (currentValues.includes(value as string)) {
        return { ...prev, [filterType]: currentValues.filter(v => v !== value) }
      } else {
        return { ...prev, [filterType]: [...currentValues, value as string] }
      }
    })
  }

  const applyFilters = () => {
    setCurrentPage(1)
    setProducts([])
    setHasMore(true)
    fetchProducts(1, true)
  }

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true)
      fetchProducts(currentPage + 1, false)
    }
  }

  const fetchProducts = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true)
        setError(null)
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
      })

      if (debouncedSearchQuery) {
        params.set('q', debouncedSearchQuery)
      }

      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) {
        params.set('minPrice', filters.priceRange[0].toString())
        params.set('maxPrice', filters.priceRange[1].toString())
      }

      if (filters.colors.length > 0) {
        params.set('colors', filters.colors.join(','))
      }

      if (filters.sizes.length > 0) {
        params.set('sizes', filters.sizes.join(','))
      }

      if (filters.categories.length > 0) {
        params.set('category', filters.categories.join(','))
      }

      const endpoint = `/api/products/search?${params.toString()}`
      const response = await fetch(endpoint)
      const result = await response.json()

      console.log("result", result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to load products')
      }

      if (reset) {
        setProducts(result.data)
      } else {
        setProducts(prev => [...prev, ...result.data])
      }

      setCurrentPage(pageNum)
      setHasMore(result.data.length === 12)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }

  useEffect(() => {
    setCurrentPage(1)
    setProducts([])
    setHasMore(true)
    fetchProducts(1, true)
  }, [debouncedSearchQuery])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const result = await response.json()
        if (result.success) {
          setCategories(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const productCards = useMemo(() => products.map(toProductCardItem), [products])

  const handleBack = () => {
    router.back()
  }

  return (
    <div className='w-full px-4 md:px-8 lg:px-16 py-8'>
      <div className='flex items-center gap-4 mb-6'>
        <button
          onClick={handleBack}
          className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200'
        >
          <ArrowLeft className='h-5 w-5' />
          <span>Back</span>
        </button>
      </div>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-primary'>Shop Products</h1>
        <p className='text-muted-foreground mt-1'>Find the perfect fit for your style.</p>
      </div>

      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Filter Sidebar - Desktop Only */}
        <div className='hidden lg:block w-full lg:w-80 shrink-0'>
          <div className='bg-card border border-border rounded-lg p-6 space-y-6'>
            <h2 className='text-xl font-semibold text-foreground'>Filters</h2>

            {/* Price Range */}
            <div>
              <h3 className='font-medium text-foreground mb-3'>Price Range</h3>
              <div className='space-y-3'>
                <div className='flex items-center space-x-2'>
                  <Input
                    type='number'
                    placeholder='Min'
                    value={filters.priceRange[0]}
                    onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                    className='w-24'
                  />
                  <span className='text-muted-foreground'>-</span>
                  <Input
                    type='number'
                    placeholder='Max'
                    value={filters.priceRange[1]}
                    onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 5000])}
                    className='w-24'
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className='font-medium text-foreground mb-3'>Categories</h3>
              <div className='space-y-2'>
                {categories.map((category) => (
                  <div key={category._id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`category-${category._id}`}
                      checked={filters.categories.includes(category._id)}
                      onCheckedChange={() => handleFilterChange('categories', category._id)}
                    />
                    <label
                      htmlFor={`category-${category._id}`}
                      className='text-sm text-muted-foreground cursor-pointer capitalize'
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <h3 className='font-medium text-foreground mb-3'>Colors</h3>
              <div className='grid grid-cols-2 space-y-2'>
                {COLORS.map((color) => (
                  <div key={color.value} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`color-${color.value}`}
                      checked={filters.colors.includes((color as any).value)}
                      onCheckedChange={() => handleFilterChange('colors', color.value)}
                    />
                    <label
                      htmlFor={`color-${color.value}`}
                      className='text-sm text-muted-foreground cursor-pointer'
                    >
                      {color.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className='font-medium text-foreground mb-3'>Sizes</h3>
              <div className='grid grid-cols-3 gap-2'>
                {SIZES.map((size) => (
                  <div key={size} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`size-${size}`}
                      checked={filters.sizes.includes(size)}
                      onCheckedChange={() => handleFilterChange('sizes', size)}
                    />
                    <label
                      htmlFor={`size-${size}`}
                      className='text-sm text-muted-foreground cursor-pointer'
                    >
                      {size}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={applyFilters} className='w-full'>
              Apply Filter
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1'>
          {/* Search Bar and Filter Button */}
          <div className='mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <input
              value={searchQuery}
              onChange={handleSearchQuery}
              placeholder='Search products...'
              className='w-full sm:w-96 border border-border rounded-md px-3 py-2 bg-card'
            />
            {/* Mobile Filter Button */}
            <Button
              onClick={() => setIsFilterOpen(true)}
              variant='outline'
              className='lg:hidden flex items-center gap-2'
            >
              <Filter className='h-4 w-4' />
              Filters
            </Button>
          </div>

          {loading && products.length === 0 && (
            <div className='w-full flex items-center justify-center'>
              <Loader2 className='animate-spin text-(--barnd-primary)' />
            </div>
          )}
          {error && <p className='text-red-600'>{error}</p>}

          {!loading && !error && products.length === 0 && (
            <p className='text-muted-foreground'>No products found for your current filters.</p>
          )}

          {/* Products Grid */}
          <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8'>
            {productCards.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && products.length > 0 && (
            <div className='flex justify-center'>
              <Button
                onClick={loadMoreProducts}
                disabled={loadingMore}
                variant='outline'
                className='px-8'
              >
                {loadingMore ? 'Loading...' : 'Load More Products'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {isFilterOpen && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          {/* Backdrop */}
          <div 
            className='absolute inset-0 bg-black/50'
            onClick={() => setIsFilterOpen(false)}
          />
          {/* Bottom Sheet */}
          <div className='absolute bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-2xl transform transition-transform duration-300 ease-out'>
            {/* Handle Bar */}
            <div className='flex justify-center py-2'>
              <div className='w-12 h-1 bg-muted-foreground/30 rounded-full' />
            </div>
            
            {/* Filter Content */}
            <div className='px-6 pb-6 max-h-[80vh] overflow-y-auto'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-semibold text-foreground'>Filters</h2>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsFilterOpen(false)}
                >
                  ✕
                </Button>
              </div>

              {/* Price Range */}
              <div className='space-y-6'>
                <div>
                  <h3 className='font-medium text-foreground mb-3'>Price Range</h3>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <Input
                        type='number'
                        placeholder='Min'
                        value={filters.priceRange[0]}
                        onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                        className='w-24'
                      />
                      <span className='text-muted-foreground'>-</span>
                      <Input
                        type='number'
                        placeholder='Max'
                        value={filters.priceRange[1]}
                        onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 5000])}
                        className='w-24'
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className='font-medium text-foreground mb-3'>Categories</h3>
                  <div className='space-y-2'>
                    {categories.map((category) => (
                      <div key={category._id} className='flex items-center space-x-2'>
                        <Checkbox
                          id={`mobile-category-${category._id}`}
                          checked={filters.categories.includes(category._id)}
                          onCheckedChange={() => handleFilterChange('categories', category._id)}
                        />
                        <label
                          htmlFor={`mobile-category-${category._id}`}
                          className='text-sm text-muted-foreground cursor-pointer capitalize'
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <h3 className='font-medium text-foreground mb-3'>Colors</h3>
                  <div className='space-y-2'>
                    {COLORS.map((color) => (
                      <div key={color.value} className='flex items-center space-x-2'>
                        <Checkbox
                          id={`mobile-color-${color.value}`}
                          checked={filters.colors.includes((color as any).value)}
                          onCheckedChange={() => handleFilterChange('colors', color.value)}
                        />
                        <label
                          htmlFor={`mobile-color-${color.value}`}
                          className='text-sm text-muted-foreground cursor-pointer'
                        >
                          {color.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className='font-medium text-foreground mb-3'>Sizes</h3>
                  <div className='grid grid-cols-3 gap-2'>
                    {SIZES.map((size) => (
                      <div key={size} className='flex items-center space-x-2'>
                        <Checkbox
                          id={`mobile-size-${size}`}
                          checked={filters.sizes.includes(size)}
                          onCheckedChange={() => handleFilterChange('sizes', size)}
                        />
                        <label
                          htmlFor={`mobile-size-${size}`}
                          className='text-sm text-muted-foreground cursor-pointer'
                        >
                          {size}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    applyFilters()
                    setIsFilterOpen(false)
                  }} 
                  className='w-full'
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
