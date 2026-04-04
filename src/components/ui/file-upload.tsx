"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function FileUpload({ images, onImagesChange, maxImages = 5, className }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback((files: FileList) => {
    const newImages: string[] = [...images];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') && newImages.length < maxImages) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            onImagesChange([...newImages, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [images, onImagesChange, maxImages]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      {images.length < maxImages && (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <CardContent className="p-6">
            <div
              className="text-center"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Drag and drop images here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="mt-4 cursor-pointer" asChild>
                  <span>Select Files</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="absolute bottom-2 left-2">
                <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      <div className="text-sm text-muted-foreground">
        {images.length} of {maxImages} images uploaded
      </div>
    </div>
  );
}
