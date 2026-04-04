"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  User,
  Package,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Copy,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    phone?: string;
    address?: any;
  };
  rating: number;
  images: string[];
  review: string;
  createdAt: string;
  updatedAt: string;
}

const ReviewDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<CustomerReview | null>(null);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer-reviews/${reviewId}`);
      const data = await response.json();

      if (data.success) {
        setReview(data.data);
      } else {
        toast.error(data.error || "Failed to fetch review");
        router.push("/admin/reviews");
      }
    } catch (error) {
      toast.error("Error fetching review");
      router.push("/admin/reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/customer-reviews/${reviewId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Review deleted successfully");
        router.push("/admin/reviews");
      } else {
        toast.error(data.error || "Failed to delete review");
      }
    } catch (error) {
      toast.error("Error deleting review");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold">({rating}.0)</span>
      </div>
    );
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return { variant: "default", label: "Excellent" };
    if (rating >= 3.5) return { variant: "secondary", label: "Good" };
    if (rating >= 2.5) return { variant: "outline", label: "Average" };
    return { variant: "destructive", label: "Poor" };
  };

  useEffect(() => {
    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  if (loading) {
    return (
      <div className="mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!review) {
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
            <h1 className="text-3xl font-bold tracking-tight">Review Details</h1>
            <p className="text-muted-foreground">
              Customer review for {review.productId.title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/reviews/${review._id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Review
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDeleteReview}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customer">Customer Info</TabsTrigger>
          <TabsTrigger value="product">Product Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Review Content */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Review Content</CardTitle>
                <CardDescription>
                  Customer feedback and rating details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Rating</h3>
                  <div className="space-y-2">
                    {renderStars(review.rating)}
                    <Badge variant={getRatingBadge(review.rating).variant as any}>
                      {getRatingBadge(review.rating).label}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2">Review Text</h3>
                  <p className="text-sm leading-relaxed bg-muted p-4 rounded-lg">
                    {review.review}
                  </p>
                </div>

                {review.images && review.images.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Review Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {review.images.map((image, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={image}
                              alt={`Review image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Review Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Review Information</CardTitle>
                <CardDescription>
                  Technical details about this review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Review ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {review._id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(review._id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="mt-1">{new Date(review.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="mt-1">{new Date(review.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Tab */}
        <TabsContent value="customer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                  Details about the customer who wrote this review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {review.userId.avatar ? (
                    <img
                      src={review.userId.avatar}
                      alt={review.userId.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{review.userId.fullName}</h3>
                    <Badge variant="outline">Verified Customer</Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{review.userId.email}</span>
                  </div>
                  {review.userId.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{review.userId.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Stats</CardTitle>
                <CardDescription>
                  Review statistics for this customer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-sm text-muted-foreground">Total Reviews</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Product Tab */}
        <TabsContent value="product" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Details about the product being reviewed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{review.productId.title}</h3>
                  <Link 
                    href={`/admin/products/${review.productId._id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Product Details
                  </Link>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Product ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {review.productId._id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(review.productId._id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Product Slug</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {review.productId.slug}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(review.productId.slug)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewDetailPage;
