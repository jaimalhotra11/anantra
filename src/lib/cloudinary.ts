import { v2 as cloudinary } from 'cloudinary'
import { WriteStream } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

// Upload helper function
export async function uploadImage(
  file: File,
  options?: {
    folder?: string
    transformation?: any
    resource_type?: 'image' | 'video' | 'auto'
  }
) {
  try {
    // For Node.js environment, we need to save the file temporarily
    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    
    // Create temporary file path
    const tempDir = os.tmpdir()
    const fileName = `${Date.now()}-${file.name}`
    const tempFilePath = path.join(tempDir, fileName)
    
    // Save file to temporary location
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(tempFilePath, buffer)
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: options?.folder || 'clothing-ecommerce/products',
      resource_type: options?.resource_type || 'auto',
      transformation: options?.transformation,
    })
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath)

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

// Delete helper function
export async function deleteImage(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId)
    return { success: true }
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}
