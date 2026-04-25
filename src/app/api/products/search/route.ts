import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { z } from 'zod'

// Advanced search schema
const searchSchema = z.object({
  q: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().optional(),
  sortBy: z.enum(['relevance', 'title', 'createdAt', 'updatedAt', 'price']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  services: z.string().optional().transform(val => val ? val.split(',') : undefined),
  colors: z.string().optional().transform(val => val ? val.split(',') : undefined),
  sizes: z.string().optional().transform(val => val ? val.split(',') : undefined),
  inStock: z.string().optional().transform(val => val === 'true'),
  hasImages: z.string().optional().transform(val => val === 'true'),
})

// GET /api/products/search - Advanced product search
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const validatedQuery = searchSchema.parse(Object.fromEntries(searchParams))

    const {
      q,
      page,
      limit,
      status,
      category,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
      services,
      colors,
      sizes,
      inStock,
      hasImages,
    } = validatedQuery

    // Build advanced search query
    const query: any = {}
    
    // Only add search conditions if query is provided
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'variants.attributes.name': { $regex: q, $options: 'i' } },
        { 'variants.attributes.value': { $regex: q, $options: 'i' } },
      ]
    }

    // Status filter (storefront defaults to published)
    if (status) {
      query.status = status
    } else {
      query.status = 'published'
    }

    // Category filter
    if (category) {
      query.category = category
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query['variants.price'] = {}
      if (minPrice !== undefined) {
        query['variants.price'].$gte = minPrice
      }
      if (maxPrice !== undefined) {
        query['variants.price'].$lte = maxPrice
      }
    }

    // Services filter
    if (services && services.length > 0) {
      query.services = { $in: services }
    }

    // Stock filter
    if (inStock) {
      query['variants.trackQuantity'] = true
      query['variants.stockQuantity'] = { $gt: 0 }
      query['variants.isActive'] = true
    }

    // Colors and Sizes filter - handle multiple combinations
    console.log("colors in filter", colors)
    console.log("sizes in filter", sizes)
    
    if (colors && colors.length > 0 || sizes && sizes.length > 0) {
      const attributeConditions = []
      
      if (colors && colors.length > 0) {
        attributeConditions.push({
          $elemMatch: {
            name: 'Color',
            value: { $in: colors }
          }
        })
      }
      
      if (sizes && sizes.length > 0) {
        attributeConditions.push({
          $elemMatch: {
            name: 'Size', 
            value: { $in: sizes }
          }
        })
      }
      
      if (attributeConditions.length === 1) {
        query['variants.attributes'] = attributeConditions[0]
      } else {
        // For both color and size filters, we need variants that match BOTH conditions
        query['variants.attributes'] = { $all: attributeConditions }
      }
    }

    // Sorting logic
    let sort: any = {}
    
    if (sortBy === 'relevance') {
      // Keep deterministic DB ordering, then finalize in-memory by score below
      sort = { title: sortOrder === 'asc' ? 1 : -1 }
    } else if (sortBy === 'price') {
      sort['variants.price'] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    }

    // Execute query with pagination
    const skip = (page - 1) * limit

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ])

    // Calculate search relevance scores (simple implementation)
    const productsWithScores = products.map(product => {
      let score = 0
      let updatedDefaultVariantId = product.defaultVariantId
      
      // Only calculate relevance scores if there's a search query
      if (q) {
        const searchQuery = q!.toLowerCase()
        
        // Title matches get highest score
        if (product.title.toLowerCase().includes(searchQuery)) {
          score += 10
        }
        
        // SKU matches get high score
        const hasSkuMatch = product.variants.some((variant: any) => 
          variant.skuCode.toLowerCase().includes(searchQuery)
        )
        if (hasSkuMatch) score += 8
        
        // Description matches get medium score
        if (product.description.toLowerCase().includes(searchQuery)) {
          score += 5
        }
        
        // Attribute matches get lower score
        const hasAttributeMatch = product.variants.some((variant: any) =>
          variant.attributes.some((attr: any) =>
            attr.name.toLowerCase().includes(searchQuery) ||
            attr.value.toLowerCase().includes(searchQuery)
          )
        )
        if (hasAttributeMatch) score += 3
      }
      
      // Update defaultVariantId based on color/size filters
      if ((colors && colors.length > 0) || (sizes && sizes.length > 0)) {
        const matchingVariant = product.variants.find((variant: any) => {
          if (!variant.isActive) return false
          
          const variantAttributes = variant.attributes.reduce((acc: any, attr: any) => {
            acc[attr.name.toLowerCase()] = attr.value
            return acc
          }, {})
          
          let matches = true
          
          if (colors && colors.length > 0) {
            matches = matches && colors.includes(variantAttributes.color)
          }
          
          if (sizes && sizes.length > 0) {
            matches = matches && sizes.includes(variantAttributes.size)
          }
          
          return matches
        })
        
        if (matchingVariant) {
          updatedDefaultVariantId = matchingVariant._id
        }
      }
      
      return { ...product, _searchScore: score, defaultVariantId: updatedDefaultVariantId }
    })

    // Sort by relevance if requested
    if (sortBy === 'relevance') {
      productsWithScores.sort((a, b) => {
        const scoreDiff = (b as any)._searchScore - (a as any)._searchScore
        return sortOrder === 'asc' ? -scoreDiff : scoreDiff
      })
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: productsWithScores,
      search: {
        query: q,
        totalCount,
        resultsCount: productsWithScores.length,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    })
  } catch (error: any) {
    console.error('Error in product search:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
