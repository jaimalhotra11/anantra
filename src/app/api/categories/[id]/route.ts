import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Category from '@/models/Category'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Category update schema
const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  parentCategory: z.string().optional(),
  order: z.number().min(0).optional(),
}).partial().refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
}).refine((data) => {
  if (data.slug) {
    return /^[a-z0-9-]+$/.test(data.slug)
  }
  return true
}, {
  message: 'Slug must contain only lowercase letters, numbers, and hyphens',
}).transform((data) => {
  // Transform "none" or empty string values to undefined for parentCategory
  if (data.parentCategory === "none" || data.parentCategory === "") {
    return { ...data, parentCategory: undefined }
  }
  return data
})

// GET /api/categories/[id] - Fetch a specific category by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    
    // Try to find by ID first, then by slug
    let category;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(id).populate('parentCategory', 'name slug');
    } else {
      category = await Category.findOne({ slug: id }).populate('parentCategory', 'name slug');
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update a specific category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication for category updates
    const authError = await requireAdmin()
    if (authError) {
      return authError
    }

    await connectDB()
    const { id } = await params

    const body = await request.json()
    const validatedData = categoryUpdateSchema.parse(body)

    // Check if category exists
    const existingCategory = await Category.findById(id)
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with existing categories (if name is being updated)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await Category.findOne({ 
        name: validatedData.name,
        _id: { $ne: id }
      })
      if (duplicateCategory) {
        return NextResponse.json(
          { success: false, error: 'Category name already exists' },
          { status: 409 }
        )
      }
    }

    // Check if new slug conflicts with existing categories (if slug is being updated)
    if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      const duplicateSlug = await Category.findOne({ 
        slug: validatedData.slug,
        _id: { $ne: id }
      })
      if (duplicateSlug) {
        return NextResponse.json(
          { success: false, error: 'Category slug already exists' },
          { status: 409 }
        )
      }
    }

    // Validate parent category if provided
    if (validatedData.parentCategory) {
      // Prevent self-reference
      if (validatedData.parentCategory === id) {
        return NextResponse.json(
          { success: false, error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      const parentCategory = await Category.findById(validatedData.parentCategory)
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 404 }
        )
      }
    }

    // Update the category
    const updateData = {
      ...validatedData,
      // Remove parentCategory if it's empty, undefined, "none", or empty string
      ...(validatedData.parentCategory && 
        validatedData.parentCategory !== "none" && 
        validatedData.parentCategory !== "" 
        ? { parentCategory: validatedData.parentCategory } 
        : {})
    };

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('parentCategory', 'name slug')
      .lean()

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully',
    })
  } catch (error) {
    console.error('Error updating category:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete a specific category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication for category deletion
    const authError = await requireAdmin()
    if (authError) {
      return authError
    }

    await connectDB()
    const { id } = await params

    // Check if category exists
    const existingCategory = await Category.findById(id)
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has child categories
    const childCategories = await Category.countDocuments({ parentCategory: id })
    if (childCategories > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with child categories' },
        { status: 400 }
      )
    }

    // Check if category is being used by products
    const Product = require('@/models/Product').default
    const productsUsingCategory = await Product.countDocuments({ category: id })
    if (productsUsingCategory > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category that is being used by products' },
        { status: 400 }
      )
    }

    // Delete the category
    await Category.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
