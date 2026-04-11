import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

// Announcement bar update schema
const announcementBarSchema = z.object({
  announcementBar: z.array(z.string()).default([])
})

// GET /api/settings/announcement-bar - Fetch announcement bar settings
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    let settings = await StoreSettings.findOne().lean()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await StoreSettings.create({})
    }

    return NextResponse.json({
      success: true,
      data: {
        announcementBar: settings.announcementBar || []
      }
    })
  } catch (error: any) {
    console.error('Error fetching announcement bar settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcement bar settings' },
      { status: 500 }
    )
  }
}

// POST /api/settings/announcement-bar - Update announcement bar settings (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin()
    if (adminCheck) return adminCheck

    await connectDB()

    const body = await request.json()
    const validatedData = announcementBarSchema.parse(body)

    // Find existing settings or create new ones
    let settings = await StoreSettings.findOne()
    
    if (!settings) {
      settings = new StoreSettings()
    }

    // Update announcement bar settings
    settings.announcementBar = validatedData.announcementBar
    await settings.save()

    return NextResponse.json({
      success: true,
      data: {
        announcementBar: settings.announcementBar
      },
      message: 'Announcement bar settings updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating announcement bar settings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid announcement bar data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update announcement bar settings' },
      { status: 500 }
    )
  }
}
