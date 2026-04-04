"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";

interface CloudinaryUploadProps {
  onUploadComplete: (imageUrl: string) => void;
  onImageRemove?: (imageUrl: string) => void;
  existingImages?: string[];
  maxImages?: number;
  className?: string;
}

export default function CloudinaryUpload({
  onUploadComplete,
  onImageRemove,
  existingImages = [],
  maxImages = 8,
  className = "",
}: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to upload image");
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);

    const totalImages = existingImages.length + files.length;
    if (totalImages > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        const imageUrl = await uploadToCloudinary(file);
        onUploadComplete(imageUrl);
        
        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-800">Upload Error</p>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"}
              ${isUploading ? "pointer-events-none opacity-50" : "hover:border-gray-400"}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Uploading images...</p>
                  <Progress value={uploadProgress} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadProgress.toFixed(0)}% complete
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop images here or click to upload
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, GIF up to 10MB each (max {maxImages} images)
                  </p>
                </div>
                <Button type="button" variant="outline">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Select Images
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      {existingImages.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Uploaded Images ({existingImages.length}/{maxImages})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  {onImageRemove && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onImageRemove(imageUrl)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
