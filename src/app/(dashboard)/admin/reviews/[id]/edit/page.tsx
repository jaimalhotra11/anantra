"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Package,
  User,
  Calendar,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import CloudinaryUpload from "@/components/CloudinaryUpload";

interface CustomerReview {
  _id: string;
  productId: {
    _id: string;
    title: string;
    slug: string;
  };
  userId: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  rating: number;
  images: string[];
  review: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewFormData {
  rating: number;
  review: string;
  images: string[];
}

const EditReviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [originalData, setOriginalData] = useState<CustomerReview | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    review: "",
    images: [],
  });

  const fetchReview = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/customer-reviews/${reviewId}`);
      const data = await response.json();

      if (data.success) {
        const review = data.data;
        setFormData({
          rating: review.rating,
          review: review.review,
          images: review.images || [],
        });
        setOriginalData(review);
      } else {
        toast.error(data.error || "Failed to fetch review");
        router.push("/admin/reviews");
      }
    } catch (error) {
      toast.error("Error fetching review");
      router.push("/admin/reviews");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  const handleImageUpload = (newImages: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages,
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.review.trim()) {
      toast.error("Review text is required");
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/customer-reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Review updated successfully!");
        router.push("/admin/reviews");
      } else {
        toast.error(data.error || "Failed to update review");
      }
    } catch (error) {
      toast.error("Error updating review");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setFormData(prev => ({ ...prev, rating: star }))}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (fetchLoading) {
    return (
      <div className="mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!originalData) {
    return (
      <div className="mx-auto space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Review not found</p>
          <Link href="/admin/reviews">
            <Button className="mt-4">Back to Reviews</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/reviews">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reviews
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Review</h1>
            <p className="text-muted-foreground">
              Update customer feedback and rating
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/reviews")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Review
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Review Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Review Information</CardTitle>
            <CardDescription>
              Basic details about the customer review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer and Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                <div className="flex items-center gap-3 mt-2">
                  {originalData.userId.avatar ? (
                    <img
                      src={originalData.userId.avatar}
                      alt={originalData.userId.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{originalData.userId.fullName}</p>
                    <p className="text-sm text-muted-foreground">{originalData.userId.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{originalData.productId.title}</p>
                    <Link 
                      href={`/admin/products/${originalData.productId._id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label htmlFor="rating">Rating *</Label>
              <div className="space-y-3">
                {renderStars(formData.rating, true)}
                <div className="flex items-center gap-2">
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      rating: parseInt(e.target.value) || 1 
                    }))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">out of 5</span>
                </div>
              </div>
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <Label htmlFor="review">Review Text *</Label>
              <Textarea
                id="review"
                value={formData.review}
                onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
                placeholder="Enter customer review..."
                rows={6}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.review.length}/1000 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Review Images Card */}
        <Card>
          <CardHeader>
            <CardTitle>Review Images</CardTitle>
            <CardDescription>
              Images uploaded by the customer with their review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No images uploaded for this review</p>
              </div>
            )}
            
            {/* Add New Images */}
            <div className="space-y-2">
              <Label>Add New Images</Label>
              <CloudinaryUpload
                onUploadComplete={(imageUrl) => handleImageUpload([...formData.images, imageUrl])}
                onImageRemove={(imageUrl) => {
                  const updatedImages = formData.images.filter(img => img !== imageUrl)
                  handleImageUpload(updatedImages)
                }}
                existingImages={formData.images}
                maxImages={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Original Review Info */}
        <Card>
          <CardHeader>
            <CardTitle>Original Review Information</CardTitle>
            <CardDescription>
              Details about when this review was originally submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Review ID</p>
                <p className="font-mono mt-1">{originalData._id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Original Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(originalData.rating)}
                  <span className="font-medium">({originalData.rating})</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Created Date</p>
                <p className="mt-1">{new Date(originalData.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="mt-1">{new Date(originalData.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default EditReviewPage;
