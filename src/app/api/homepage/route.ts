import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { StoreSettings } from '@/models/StoreSettings'

// GET /api/homepage - Fetch all homepage data
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Fetch all data in parallel for better performance
    const [
      heroBannersSettings,
      testimonialsSettings,
      newArrivalsProducts,
      topSellingProducts,
      categories,
      browseByCategorySettings
    ] = await Promise.all([
      // Hero banners from store settings
      StoreSettings.findOne().select('heroBanners').lean(),
      
      // Testimonials from store settings
      StoreSettings.findOne().select('testimonials').lean(),
      
      // New arrivals (latest published products)
      Product.find({ status: 'published' })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      
      // Top selling products (you can modify this logic based on your needs)
      Product.find({ status: 'published' })
        .populate('category', 'name slug')
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
      
      // Categories for browse section
      Category.find({ isActive: true })
        .select('name slug image description')
        .sort({ name: 1 })
        .lean(),
      
      // Browse by category settings
      StoreSettings.findOne().select('browseByCategory').lean()
    ])

    // Transform products data for frontend consumption
    const transformProducts = (products: any[]) => {
      return products.map(product => {
        const defaultVariant = product.variants?.find((v: any) => v.isActive) || product.variants?.[0]
        return {
          id: product._id.toString(),
          name: product.title,
          price: defaultVariant?.price || 0,
          salePrice: defaultVariant?.cuttedPrice || null,
          discount: defaultVariant?.cuttedPrice 
            ? Math.round(((defaultVariant.price - defaultVariant.cuttedPrice) / defaultVariant.price) * 100)
            : 0,
          rating: 4.5, // You can add rating field to product model if needed
          slug: product.slug,
          mainImage: defaultVariant?.images?.[0] || '/placeholder-product.jpg',
          hoverImage: defaultVariant?.images?.[1] || defaultVariant?.images?.[0] || '/placeholder-product.jpg',
          category: product.category?.name || '',
          categorySlug: product.category?.slug || '',
          services: product.services || []
        }
      })
    }

    // Transform categories data
    const transformCategories = (categories: any[], browseSettings: any) => {
      if (browseSettings?.browseByCategory) {
        // Use configured browse by categories
        const browseCategories = []
        for (let i = 1; i <= 5; i++) {
          const categoryKey = `category${i}` as keyof typeof browseSettings.browseByCategory
          const categoryData = browseSettings.browseByCategory[categoryKey]
          if (categoryData?.categoryName) {
            browseCategories.push({
              name: categoryData.categoryName,
              image: categoryData.categoryImage || '/placeholder-category.jpg',
              slug: categoryData.categoryName.toLowerCase().replace(/\s+/g, '-')
            })
          }
        }
        return browseCategories
      } else {
        // Use all available categories
        return categories.map(category => ({
          name: category.name,
          image: category.image || '/placeholder-category.jpg',
          slug: category.slug,
          description: category.description
        }))
      }
    }

    // Transform testimonials data
    const transformTestimonials = (testimonials: any) => {
      if (!testimonials?.testimonials) {
        return {
          title: "What Our Customers Say",
          description: "Real experiences from our valued customers",
          reviews: []
        }
      }

      return {
        title: testimonials.testimonials.testimonialSectionHeading || "What Our Customers Say",
        description: testimonials.testimonials.testimonialSectionDescription || "Real experiences from our valued customers",
        reviews: (testimonials.testimonials.reviews || []).map((review: any, index: number) => ({
          id: (index + 1).toString(),
          name: review.customerName,
          role: "Customer", // You can add role field if needed
          content: review.customerMessage,
          rating: review.customerRating,
          avatar: review.customerProfile || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.customerName)}&background=random`
        }))
      }
    }

    const homepageData = {
      heroBanners: heroBannersSettings?.heroBanners || [],
      newArrivals: transformProducts(newArrivalsProducts),
      topSelling: transformProducts(topSellingProducts),
      categories: transformCategories(categories, browseByCategorySettings),
      testimonials: transformTestimonials(testimonialsSettings)
    }

    return NextResponse.json({
      success: true,
      data: homepageData
    })
  } catch (error: any) {
    console.error('Error fetching homepage data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homepage data' },
      { status: 500 }
    )
  }
}