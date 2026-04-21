'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductGallery from '@/components/store/ProductGallery'
import ProductCard from '@/components/ui/ProductCard'
import { Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus, ShoppingBag, ChevronDown, ChevronUp, Star, X, Ruler, Package, Clock, ArrowRight, Camera, Upload, ArrowLeft } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { addGuestCartItem } from '@/lib/storefront'
import { useCart } from '@/contexts/CartContext'

interface Product {
  _id: string
  title: string
  description: string
  status: string
  services: string[]
  slug: string
  defaultVariantId?: string
  category?: {
    _id: string
    name: string
    slug: string
  } | string
  variants: {
    _id: string
    attributes: { name: string, value: string }[]
    images: string[]
    price: number
    cuttedPrice?: number
    trackQuantity: boolean
    stockQuantity?: number
    isActive?: boolean
  }[]
}

interface Review {
  _id?: string
  productId?: any
  userId?: any
  rating: number
  images: string[]
  review: string
  createdAt: string
  updatedAt: string
  user?: {
    fullName: string
    email: string
    avatar?: string
  }
}

const ProductPage = () => {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const { data: session } = useSession()
  const { refreshCart } = useCart()

  const handleBack = () => {
    router.back()
  }
  
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [showSizeChart, setShowSizeChart] = useState(false)
  const [expandedDescription, setExpandedDescription] = useState(false)
  const [expandedShipping, setExpandedShipping] = useState(false)
  const [reviewPage, setReviewPage] = useState(1)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', name: '', email: '' })
  const [reviewImages, setReviewImages] = useState<File[]>([])
  const [submittingReview, setSubmittingReview] = useState(false)
  
  // API states
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartMessage, setCartMessage] = useState<string | null>(null)

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/products/${slug}`)
        
        if (!response.ok) {
          throw new Error('Product not found')
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setProduct(result.data)
          // Set default variant if available
          if (result.data.defaultVariantId) {
            setSelectedVariant(result.data.defaultVariantId)
          } else if (result.data.variants && result.data.variants.length > 0) {
            setSelectedVariant(result.data.variants[0]._id)
          }
        } else {
          throw new Error(result.error || 'Failed to fetch product')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  // Fetch reviews and related products when product is loaded
  useEffect(() => {
    if (!product?._id) return

    const fetchRelatedProducts = async () => {
      try {
        setRelatedLoading(true)
        // Fetch products from same category, excluding current product
        const categoryParam = product.category ? `&category=${(product.category as any)._id || product.category}` : ''
        const response = await fetch(`/api/products?status=published${categoryParam}&limit=8`)
        const result = await response.json()
        if (result.success) {
          // Filter out current product and limit to 4 related products
          const filtered = result.data.filter((p: Product) => p._id !== product._id).slice(0, 4)
          setRelatedProducts(filtered)
        }
      } catch (err) {
        console.error('Failed to fetch related products:', err)
      } finally {
        setRelatedLoading(false)
      }
    }

    fetchReviews()
    fetchRelatedProducts()
  }, [product])

  // Helper functions for reviews
  const getReviewStats = () => {
    if (reviews.length === 0) return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] }
    
    const total = reviews.length
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    const average = sum / total
    
    const distribution = [0, 0, 0, 0, 0]
    reviews.forEach(review => {
      distribution[review.rating - 1]++
    })
    
    return { average, total, distribution }
  }

  const getCurrentVariant = () => {
    if (!product || !selectedVariant) return null
    return product.variants.find(v => v._id === selectedVariant)
  }

  const getProductImages = () => {
    if (!product) return []
    const currentVariant = getCurrentVariant()
    return currentVariant?.images || []
  }

  const getProductPrice = () => {
    const currentVariant = getCurrentVariant()
    return currentVariant?.price || 0
  }

  const getProductOriginalPrice = () => {
    const currentVariant = getCurrentVariant()
    return currentVariant?.cuttedPrice
  }

  const getDiscountPercentage = () => {
    const price = getProductPrice()
    const originalPrice = getProductOriginalPrice()
    if (!originalPrice || originalPrice <= price) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  const getVariantDisplayInfo = (variant: any) => {
    const colorAttr = variant.attributes.find((attr: any) => attr.name.toLowerCase() === 'color')
    const sizeAttr = variant.attributes.find((attr: any) => attr.name.toLowerCase() === 'size')
    
    return {
      color: colorAttr?.value || '',
      size: sizeAttr?.value || '',
      stock: variant.trackQuantity && variant.stockQuantity !== undefined 
        ? variant.stockQuantity > 2 ? 'In Stock' : `Only ${variant.stockQuantity} left`
        : 'In Stock'
    }
  }

  const getAllSizes = () => {
    if (!product) return []
    const sizes = new Set<string>()
    product.variants.forEach(variant => {
      const sizeAttr = variant.attributes.find((attr: any) => attr.name.toLowerCase() === 'size')
      if (sizeAttr) sizes.add(sizeAttr.value)
    })
    return Array.from(sizes).sort()
  }

  const getAllColors = () => {
    if (!product) return []
    const colors = new Set<string>()
    product.variants.forEach(variant => {
      const colorAttr = variant.attributes.find((attr: any) => attr.name.toLowerCase() === 'color')
      if (colorAttr) colors.add(colorAttr.value)
    })
    return Array.from(colors)
  }

  // Size chart data
  const sizeChart = {
    xs: { bust: '32-33', waist: '25-26', hips: '35-36' },
    s: { bust: '34-35', waist: '27-28', hips: '37-38' },
    m: { bust: '36-37', waist: '29-30', hips: '39-40' },
    l: { bust: '38-39', waist: '31-32', hips: '41-42' },
    xl: { bust: '40-41', waist: '33-34', hips: '43-44' }
  }

  const reviewsPerPage = 6
  const totalPages = Math.ceil(reviews.length / reviewsPerPage)
  const displayedReviews = reviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage
  )

  const incrementQuantity = () => setQuantity(prev => prev + 1)
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1))

  const handleAddToCart = async () => {
    if (!product) return
    const currentVariant = getCurrentVariant()
    if (!currentVariant) return

    try {
      setCartLoading(true)
      setCartMessage(null)

      if (!session?.user) {
        addGuestCartItem({
          productId: product._id,
          variantId: currentVariant._id,
          quantity,
          priceAtTime: currentVariant.price,
          product: {
            title: product.title,
            slug: product.slug,
            image: currentVariant.images?.[0] || '/placeholder-product.jpg',
            variantAttributes: currentVariant.attributes || [],
          },
        })
        setCartMessage('Added to cart')
        refreshCart()
        return
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          variantId: currentVariant._id,
          quantity,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to add to cart')
      }
      setCartMessage('Added to cart')
      refreshCart()
    } catch (cartError) {
      setCartMessage(cartError instanceof Error ? cartError.message : 'Failed to add to cart')
    } finally {
      setCartLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setReviewImages(prev => [...prev, ...files].slice(0, 3)) // Limit to 3 images
  }

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const fetchReviews = async () => {
    if (!product?._id) return

    try {
      setReviewsLoading(true)
      const response = await fetch(`/api/customer-reviews?productId=${product._id}&limit=50`)
      const result = await response.json()
      if (result.success) {
        setReviews(result.data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!product?._id) return

    try {
      setSubmittingReview(true)

      // Validate required fields
      if (!newReview.comment.trim()) {
        alert('Please write a review before submitting')
        return
      }

      if (!session?.user && (!newReview.name.trim() || !newReview.email.trim())) {
        alert('Please provide your name and email to submit a review')
        return
      }

      // Upload images first
      const uploadedImages: string[] = []
      for (const file of reviewImages) {
        const formData = new FormData()
        formData.append('file', file)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          if (uploadResult.success) {
            uploadedImages.push(uploadResult.url)
          }
        }
      }

      // Prepare review data
      const reviewData = {
        productId: product._id,
        rating: newReview.rating,
        review: newReview.comment,
        images: uploadedImages,
        ...(session?.user ? { userId: session.user.id } : {
          user: {
            fullName: newReview.name,
            email: newReview.email,
          }
        })
      }

      // Submit review
      const response = await fetch('/api/customer-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData)
      })

      const result = await response.json()

      if (result.success) {
        // Refresh reviews list
        await fetchReviews()
        
        // Reset form
        setShowReviewForm(false)
        setNewReview({ rating: 5, comment: '', name: '', email: '' })
        setReviewImages([])
        
        alert('Review submitted successfully!')
      } else {
        alert(result.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl'>
            <Package className='h-8 w-8 animate-spin text-primary-foreground' />
          </div>
          <div className='space-y-2'>
            <h2 className='text-lg font-semibold text-foreground'>Loading product details...</h2>
            <p className='text-sm text-muted-foreground'>Please wait while we prepare this amazing product for you</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The product you are looking for does not exist.'}</p>
          <a href="/store" className="bg-brand-primary text-white px-6 py-3 rounded-md hover:bg-brand-primary/90 transition-colors">
            Continue Shopping
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className='flex items-center gap-4 mb-6'>
          <button
            onClick={handleBack}
            className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200'
          >
            <ArrowLeft className='h-5 w-5' />
            <span>Back</span>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Left Column - Product Gallery */}
          <div className="order-1">
            <ProductGallery
              images={getProductImages()}
              altPrefix={product.title}
              aspectRatio="portrait"
            />
          </div>

          {/* Right Column - Product Details */}
          <div className="order-2 space-y-6">

            {/* Product Title & Rating */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {product.title}
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < Math.floor(getReviewStats().average) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{getReviewStats().average.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-500">({getReviewStats().total} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                ₹{getProductPrice().toLocaleString('en-IN')}
              </span>
              {getProductOriginalPrice() && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ₹{getProductOriginalPrice()!.toLocaleString('en-IN')}
                  </span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 text-sm font-semibold rounded">
                    {getDiscountPercentage()}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Product Variants - Amazon Style */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Variants</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {product.variants.map(variant => {
                  const displayInfo = getVariantDisplayInfo(variant)
                  return (
                    <div
                      key={variant._id}
                      className={`border border-gray-200 rounded-lg p-4 hover:border-brand-primary transition-colors cursor-pointer ${selectedVariant === variant._id ? 'border-brand-primary' : ''}`}
                      onClick={() => setSelectedVariant(variant._id)}
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={variant.images[0] || '/placeholder-image.jpg'}
                          alt={`${displayInfo.color} - ${displayInfo.size}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{displayInfo.color} - {displayInfo.size}</p>
                        <p className="text-lg font-bold text-brand-primary">₹{variant.price.toLocaleString('en-IN')}</p>
                        <p className={`text-xs ${displayInfo.stock.includes('Only') ? 'text-orange-500' : 'text-gray-500'}`}>{displayInfo.stock}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold">Quantity</span>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decrementQuantity}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="flex-1 bg-(--brand-primary) text-white py-3 px-6 rounded-md hover:bg-(--brand-primary)/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{cartLoading ? 'Adding...' : 'Add to Cart'}</span>
                </button>
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              {cartMessage && <p className="text-sm text-(--brand-primary)">{cartMessage}</p>}
            </div>

            {/* Product Benefits - Horizontal Scrollable */}
            <div className="overflow-x-auto w-full pb-2">
              <div className="flex items-center justify-evenly scroll-auto space-x-1 w-full">
                <div className="flex items-center space-x-2 bg-white border border-neutral-100 rounded-lg px-3 py-3 text-center text-xs shrink-0 flex-col w-32 h-20 border-neutral-500 wrap-break-word">
                  <Truck className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">Free Delivery</span>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-neutral-100 rounded-lg px-3 py-3 text-center text-xs shrink-0 flex-col w-32 h-20 border-neutral-500 wrap-break-word">
                  <Package className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">Cash on Delivery</span>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-neutral-100 rounded-lg px-3 py-3 text-center text-xs flex-col w-32 h-20 border-neutral-500 wrap-break-word">
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Discount on Prepaid</span>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-neutral-100 rounded-lg px-3 py-3 text-center text-xs flex-col w-32 h-20 border-neutral-500 wrap-break-word">
                  <RotateCcw className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">7 Day Return</span>
                </div>
              </div>
            </div>

            {/* Collapsible Product Description */}
            <div className="border-t pt-6">
              <button
                onClick={() => setExpandedDescription(!expandedDescription)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold">Product Description</h3>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedDescription ? 'rotate-180' : ''}`} />
              </button>
              <div className={`mt-4 overflow-hidden transition-all duration-300 ${expandedDescription ? 'max-h-96' : 'max-h-0'}`}>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {product.services?.map((service, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span className="capitalize">{service.replace('-', ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Collapsible Shipping Details */}
            <div className="border-t pt-6">
              <button
                onClick={() => setExpandedShipping(!expandedShipping)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold">Shipping & Delivery</h3>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedShipping ? 'rotate-180' : ''}`} />
              </button>
              <div className={`mt-4 overflow-hidden transition-all duration-300 ${expandedShipping ? 'max-h-96' : 'max-h-0'}`}>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <Truck className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Standard Delivery</p>
                      <p>5-7 business days. Free on orders above ₹2000.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Express Delivery</p>
                      <p>2-3 business days. ₹150 extra charge.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Order Processing</p>
                      <p>Orders are processed within 24 hours on business days.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Size Chart Modal */}
        {showSizeChart && (
          <div className="fixed inset-0 bg-(--brand-primary)/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowSizeChart(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold mb-4">Size Chart</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Size</th>
                      <th className="text-left py-2">Bust (in)</th>
                      <th className="text-left py-2">Waist (in)</th>
                      <th className="text-left py-2">Hips (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sizeChart).map(([size, measurements]) => (
                      <tr key={size} className="border-b">
                        <td className="py-2 font-medium uppercase">{size}</td>
                        <td className="py-2">{measurements.bust}</td>
                        <td className="py-2">{measurements.waist}</td>
                        <td className="py-2">{measurements.hips}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <p>* All measurements are in inches</p>
                <p>* Please allow 0.5-1 inch variation due to manual measurement</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>

            {/* Review Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl font-bold">{getReviewStats().average.toFixed(1)}</div>
                  <div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.floor(getReviewStats().average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Based on {getReviewStats().total} reviews</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-(--brand-primary) text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Write Review
                </button>
              </div>

              {/* Review Distribution */}
              <div className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = getReviewStats().distribution[5 - rating]
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="text-sm w-12">{rating} ★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Reviews Grid */}
            {reviewsLoading ? (
              <div className='text-center py-12'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4'>
                  <Star className='h-6 w-6 animate-spin text-primary' />
                </div>
                <div className='space-y-2'>
                  <h3 className='text-lg font-semibold text-foreground'>Loading reviews...</h3>
                  <p className='text-sm text-muted-foreground'>Please wait while we fetch customer reviews</p>
                </div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {displayedReviews.map((review) => (
                  <div key={review._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{review.user?.fullName?.charAt(0) || 'A'}</span>
                        </div>
                        <div>
                          <p className="font-medium">{review.user?.fullName || 'Anonymous'}</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Verified</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">{review.review}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.slice(0, 3).map((image, index) => (
                          <img key={index} src={image} alt={`Review image ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setReviewPage(Math.max(1, reviewPage - 1))}
                  disabled={reviewPage === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setReviewPage(i + 1)}
                    className={`px-3 py-1 border rounded-md transition-colors ${reviewPage === i + 1
                        ? 'bg-(--brand-primary) text-white'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setReviewPage(Math.min(totalPages, reviewPage + 1))}
                  disabled={reviewPage === totalPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-(--brand-primary)/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide shadow-2xl">
              {/* Header */}
              <div className="bg-(--brand-primary) text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Share Your Experience</h3>
                    <p className="text-white/60 text-sm">Help others make informed decisions</p>
                  </div>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Rating Section */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-3">How would you rate this product?</label>
                  <div className="flex justify-center space-x-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setNewReview({ ...newReview, rating })}
                        className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                          rating <= newReview.rating 
                            ? 'bg-(--brand-primary) text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Star className={`w-8 h-8 ${rating <= newReview.rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {newReview.rating === 5 && 'Excellent!'}
                    {newReview.rating === 4 && 'Very Good'}
                    {newReview.rating === 3 && 'Good'}
                    {newReview.rating === 2 && 'Fair'}
                    {newReview.rating === 1 && 'Poor'}
                  </p>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Add Photos (Optional)
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      {reviewImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Review image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {reviewImages.length < 3 && (
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-(--brand-primary) hover:bg-(--brand-primary)/10 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Add Photo</span>
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Add up to 3 photos to show your experience</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all h-32 resize-none"
                    placeholder="Tell us about your experience with this product..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="flex-1 bg-(--brand-primary) text-white py-3 px-6 rounded-lg hover:bg-(brand-primary)-hover transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submittingReview ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* You Might Also Like Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">You Might Also Like</h2>
            <p className="text-gray-600">Discover similar products that complement your style</p>
          </div>
          {relatedLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading related products...</p>
            </div>
          ) : relatedProducts.length > 0 ? (
            <>
              <div className="flex flex-wrap justify-center gap-6">
                {relatedProducts.map((relatedProduct) => {
                  // Transform product data for ProductCard component
                  const firstVariant = relatedProduct.variants[0]
                  const cardProduct = {
                    id: relatedProduct._id,
                    name: relatedProduct.title,
                    price: firstVariant?.price || 0,
                    salePrice: firstVariant?.cuttedPrice || firstVariant?.price || 0,
                    slug: relatedProduct.slug,
                    rating: 4.5, // Default rating
                    discount: firstVariant?.cuttedPrice ? Math.round(((firstVariant.cuttedPrice - firstVariant.price) / firstVariant.cuttedPrice) * 100) : 0,
                    mainImage: firstVariant?.images[0] || '/placeholder-image.jpg',
                    hoverImage: firstVariant?.images[1] || firstVariant?.images[0] || '/placeholder-image.jpg'
                  }
                  return <ProductCard key={relatedProduct._id} product={cardProduct} />
                })}
              </div>
              <div className="text-center mt-8">
                <Link href="/products" className="inline-flex items-center space-x-2 bg-(--brand-primary) text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors">
                  <span>View All Products</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No related products found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductPage
