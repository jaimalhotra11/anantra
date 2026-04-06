import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import Product from '@/models/Product'
import Category from '@/models/Category'

// GET /api/homepage - Fetch all homepage data
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Fetch all data in parallel for better performance
    const [
      settings,
      categories
    ] = await Promise.all([
      // Store settings (hero banners, testimonials, product groups, etc.)
      StoreSettings.findOne().lean(),
      
      // Categories for browse by category section
      Category.find({ isActive: true })
        .sort({ name: 'asc' })
        .lean()
    ])

    // Transform products to match frontend interface
    const transformProduct = (product: any) => ({
      id: product._id.toString(),
      name: product.title,
      price: product.variants[0]?.price || 0,
      salePrice: product.variants[0]?.cuttedPrice,
      discount: product.variants[0]?.cuttedPrice 
        ? Math.round(((product.variants[0].cuttedPrice - product.variants[0].price) / product.variants[0].cuttedPrice) * 100)
        : 0,
      rating: 4.5, // Default rating - you can add rating field to product model later
      slug: product.slug,
      mainImage: product.variants[0]?.images[0] || '',
      hoverImage: product.variants[0]?.images[1] || product.variants[0]?.images[0] || '',
      category: product.category?.name || '',
      categorySlug: product.category?.slug || '',
      services: product.services || []
    })

    // Helper function to fetch products by slugs and transform them
    const fetchAndTransformProducts = async (productSlugs: string[]) => {
      if (!productSlugs || productSlugs.length === 0) return []
      
      // Filter out empty slugs
      const validProductSlugs = productSlugs.filter(slug => slug && slug.trim() !== '')
      
      if (validProductSlugs.length === 0) return []
      
      const products = await Product.find({ 
        slug: { $in: validProductSlugs }, 
        status: 'published' 
      })
        .populate('category', 'name slug')
        .lean()
      
      return products.map(transformProduct)
    }

    // Fetch products for both product groups
    console.log('Product Group 1 Slugs:', settings?.productGroup1?.products)
    console.log('Product Group 2 Slugs:', settings?.productGroup2?.products)
    
    const [productGroup1Products, productGroup2Products] = await Promise.all([
      fetchAndTransformProducts(settings?.productGroup1?.products || []),
      fetchAndTransformProducts(settings?.productGroup2?.products || [])
    ])

    // Transform categories to match frontend interface
    const transformCategory = (category: any, index: number) => ({
      name: category.name,
      image: category.image || '',
      slug: category.slug || '',
      description: category.description || ''
    })

    // Prepare homepage data
    const homepageData = {
      heroBanners: settings?.heroBanners || [],
      productGroup1: {
        name: settings?.productGroup1?.name || 'Product Group 1',
        description: settings?.productGroup1?.description || '',
        products: productGroup1Products
      },
      productGroup2: {
        name: settings?.productGroup2?.name || 'Product Group 2',
        description: settings?.productGroup2?.description || '',
        products: productGroup2Products
      },
      categories: [
        // Use settings categories first, then fallback to database categories
        ...(settings?.browseByCategory ? [
          settings.browseByCategory.category1,
          settings.browseByCategory.category2,
          settings.browseByCategory.category3,
          settings.browseByCategory.category4,
          settings.browseByCategory.category5
        ].filter(Boolean).map((cat, index) => ({
          name: cat!.categoryName,
          image: cat!.categoryImage || '',
          slug: cat!.categoryName.toLowerCase().replace(/\s+/g, '-'),
          description: ''
        })) : []),
        // Add database categories if no settings categories or to fill up to 5 categories
        ...categories.slice(0, 5 - (settings?.browseByCategory ? 
          Object.values(settings.browseByCategory).filter(Boolean).length : 0))
          .map(transformCategory)
      ].slice(0, 5), // Limit to 5 categories
      testimonials: {
        title: settings?.testimonials?.testimonialSectionHeading || 'What Our Customers Say',
        description: settings?.testimonials?.testimonialSectionDescription || 'Read reviews from our satisfied customers',
        reviews: (settings?.testimonials?.reviews || []).map((review: any) => ({
          id: Math.random().toString(36).substr(2, 9), // Generate random ID
          name: review.customerName,
          role: 'Verified Customer', // Default role
          content: review.customerMessage,
          rating: review.customerRating,
          avatar: review.customerProfile || ''
        }))
      }
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
