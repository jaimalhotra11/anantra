"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Save,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Package,
  User,
  Mail,
  Phone,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";

interface Product {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
}

interface ReviewFormData {
  productId: string;
  userId?: string;
  rating: number;
  review: string;
  images: string[];
  user: {
    fullName: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
}

const AddReviewPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [useExistingUser, setUseExistingUser] = useState(false);
  const [formData, setFormData] = useState<ReviewFormData>({
    productId: "",
    rating: 5,
    review: "",
    images: [],
    user: {
      fullName: "",
      email: "",
      avatar: "",
      phone: "",
    },
  });

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const params = new URLSearchParams({
        limit: "50",
        status: "published", // Only show published products
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error(data.error || "Failed to fetch products");
      }
    } catch (error) {
      toast.error("Error fetching products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

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
    if (!formData.productId) {
      toast.error("Please select a product");
      return;
    }

    if (!useExistingUser && !formData.user.fullName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!useExistingUser && !formData.user.email.trim()) {
      toast.error("Customer email is required");
      return;
    }

    if (!useExistingUser && !formData.user.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

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
      const payload = {
        productId: formData.productId,
        rating: formData.rating,
        review: formData.review,
        images: formData.images,
        ...(useExistingUser && formData.userId && { userId: formData.userId }),
        ...(!useExistingUser && { user: formData.user }),
      };

      const response = await fetch("/api/customer-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Review added successfully!");
        router.push("/admin/reviews");
      } else {
        toast.error(data.error || "Failed to add review");
      }
    } catch (error) {
      toast.error("Error adding review");
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

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold tracking-tight">Add Review</h1>
            <p className="text-muted-foreground">
              Add a customer review for any product
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
                Adding...
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Add Review
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Selection</CardTitle>
            <CardDescription>
              Choose the product to review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Search */}
            <div className="space-y-2">
              <Label>Search Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Product List */}
            <div className="space-y-2">
              <Label>Select Product *</Label>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{product.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.slug}
                            </div>
                          </div>
                          <Badge variant={product.status === 'published' ? 'default' : 'secondary'} className="ml-auto">
                            {product.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Product Info */}
            {formData.productId && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <Label className="text-sm font-medium">Selected Product</Label>
                {(() => {
                  const selectedProduct = products.find(p => p._id === formData.productId);
                  return selectedProduct ? (
                    <div className="mt-2 flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedProduct.title}</p>
                        <p className="text-sm text-muted-foreground">{selectedProduct.slug}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Content */}
        <Card>
          <CardHeader>
            <CardTitle>Review Content</CardTitle>
            <CardDescription>
              Rating and review details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="space-y-3">
                {renderStars(formData.rating, true)}
                <div className="flex items-center gap-2">
                  <Input
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
              <Label>Review Text *</Label>
              <Textarea
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

            {/* Review Images */}
            <div className="space-y-2">
              <Label>Review Images</Label>
              <FileUpload
                images={formData.images}
                onImagesChange={handleImageUpload}
                maxImages={5}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Information */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>
            Details about the customer leaving the review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Type Selection */}
          <div className="space-y-2">
            <Label>Review Type</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-existing-user"
                  checked={useExistingUser}
                  onCheckedChange={(checked) => setUseExistingUser(checked === true)}
                />
                <Label htmlFor="use-existing-user" className="text-sm font-normal">
                  Use existing user from database
                </Label>
              </div>
            </div>
          </div>

          {useExistingUser ? (
            /* Existing User Selection */
            <div className="space-y-2">
              <Label>Existing User ID</Label>
              <Input
                value={formData.userId || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="Enter user ID..."
              />
              <p className="text-xs text-muted-foreground">
                Enter the ID of an existing user from your database
              </p>
            </div>
          ) : (
            /* New User Information */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    value={formData.user.fullName}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      user: { ...prev.user, fullName: e.target.value } 
                    }))}
                    placeholder="Enter customer full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="email"
                    value={formData.user.email}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      user: { ...prev.user, email: e.target.value } 
                    }))}
                    placeholder="customer@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profile Picture URL</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    value={formData.user.avatar || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      user: { ...prev.user, avatar: e.target.value } 
                    }))}
                    placeholder="https://example.com/avatar.jpg"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    value={formData.user.phone || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      user: { ...prev.user, phone: e.target.value } 
                    }))}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Avatar Preview */}
          {formData.user.avatar && (
            <div className="space-y-2">
              <Label>Avatar Preview</Label>
              <div className="flex items-center justify-center">
                <img
                  src={formData.user.avatar}
                  alt="Customer avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-muted"
                  onError={(e) => {
                    e.currentTarget.src = "";
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddReviewPage;
