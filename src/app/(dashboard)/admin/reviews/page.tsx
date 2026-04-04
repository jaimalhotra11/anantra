"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Star,
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Search, 
  Filter,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  User,
  Package,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  recentReviews: number;
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(ratingFilter !== "all" && { rating: ratingFilter }),
      });

      const response = await fetch(`/api/customer-reviews?${params}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch reviews");
      }
    } catch (error) {
      toast.error("Error fetching reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/customer-reviews/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data.overview);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [pagination.currentPage, searchQuery, ratingFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`/api/customer-reviews/${reviewId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Review deleted successfully");
        fetchReviews();
        fetchStats();
      } else {
        toast.error(data.error || "Failed to delete review");
      }
    } catch (error) {
      toast.error("Error deleting review");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedReviews.length === 0) {
      toast.error("Please select reviews first");
      return;
    }

    try {
      const response = await fetch("/api/customer-reviews/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reviewIds: selectedReviews,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Reviews ${action}d successfully`);
        setSelectedReviews([]);
        fetchReviews();
        fetchStats();
      } else {
        toast.error(data.error || `Failed to ${action} reviews`);
      }
    } catch (error) {
      toast.error(`Error performing ${action} action`);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">({rating})</span>
      </div>
    );
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return { variant: "default", label: "Excellent" };
    if (rating >= 3.5) return { variant: "secondary", label: "Good" };
    if (rating >= 2.5) return { variant: "outline", label: "Average" };
    return { variant: "destructive", label: "Poor" };
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Reviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentReviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5 Star Reviews</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reviews.filter(r => r.rating === 5).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Reviews</h1>
          <p className="text-muted-foreground">
            Manage customer feedback and reviews
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedReviews.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedReviews.length} items selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkAction("delete")}
          >
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedReviews([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Reviews Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedReviews(reviews.map(r => r._id));
                      } else {
                        setSelectedReviews([]);
                      }
                    }}
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading reviews...
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No reviews found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review._id}>
                    <TableCell>
                      <Checkbox
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedReviews([...selectedReviews, review._id]);
                          } else {
                            setSelectedReviews(selectedReviews.filter(id => id !== review._id));
                          }
                        }}
                        checked={selectedReviews.includes(review._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {review.userId.avatar ? (
                          <img
                            src={review.userId.avatar}
                            alt={review.userId.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{review.userId.fullName}</div>
                          <div className="text-sm text-muted-foreground">
                            {review.userId.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <Link 
                          href={`/admin/products/${review.productId._id}`}
                          className="hover:underline"
                        >
                          {review.productId.title}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {renderStars(review.rating)}
                        <Badge variant={getRatingBadge(review.rating).variant as any}>
                          {getRatingBadge(review.rating).label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm line-clamp-2">
                          {review.review}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{review.images.length}</span>
                        {review.images.length > 0 && (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/reviews/${review._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/reviews/${review._id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteReview(review._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
            {pagination.totalCount} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === 1}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
