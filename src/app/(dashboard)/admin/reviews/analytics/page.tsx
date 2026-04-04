"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  Star,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Package,
  ThumbsUp,
  Calendar,
  RefreshCw,
  Users,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReviewStats {
  overview: {
    totalReviews: number;
    averageRating: number;
    totalRatingSum: number;
    recentReviews: number;
  };
  distribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  recentReviews: Array<{
    _id: string;
    userId: {
      fullName: string;
      email: string;
      avatar?: string;
    };
    productId: {
      title: string;
      slug: string;
    };
    rating: number;
    review: string;
    createdAt: string;
  }>;
  topRatedProducts: Array<{
    productId: string;
    productTitle: string;
    productSlug: string;
    avgRating: number;
    reviewCount: number;
  }>;
  period: {
    days: number | null;
    fromDate: string | null;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReviewAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  const fetchStats = async (days?: number) => {
    try {
      if (days) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = days ? `?days=${days}` : "";
      const response = await fetch(`/api/customer-reviews/stats${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        toast.error(data.error || "Failed to fetch analytics");
      }
    } catch (error) {
      toast.error("Error fetching analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(parseInt(timeRange));
  }, [timeRange]);

  const handleRefresh = () => {
    fetchStats(parseInt(timeRange));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 3.5) return '#22c55e';
    if (rating >= 2.5) return '#f59e0b';
    if (rating >= 1.5) return '#f97316';
    return '#ef4444';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Average';
    if (rating >= 1.5) return 'Poor';
    return 'Very Poor';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  const ratingDistributionData = stats.distribution.map(item => ({
    name: `${item.rating} Stars`,
    value: item.count,
    color: getRatingColor(item.rating),
  }));

  const recentReviewsData = stats.recentReviews.map(review => ({
    date: new Date(review.createdAt).toLocaleDateString(),
    rating: review.rating,
    customer: review.userId.fullName,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into customer feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.recentReviews} in last {stats.period.days || 'all time'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(stats.overview.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5 Star Reviews</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.distribution.find(d => d.rating === 5)?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.totalReviews > 0 
                ? `${((stats.distribution.find(d => d.rating === 5)?.count || 0) / stats.overview.totalReviews * 100).toFixed(1)}% of total`
                : '0% of total'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Trend</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.overview.recentReviews > 0 ? (
                <><TrendingUp className="inline h-5 w-5 text-green-600 mr-1" />Positive</>
              ) : (
                <><TrendingDown className="inline h-5 w-5 text-red-600 mr-1" />Stable</>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="flex flex-col space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Rating Distribution</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="recent">Recent Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>
                  Breakdown of reviews by star ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ratingDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ratingDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rating Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Breakdown</CardTitle>
                <CardDescription>
                  Detailed view of rating categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.distribution.map((item) => (
                    <div key={item.rating} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getRatingColor(item.rating) }}
                        />
                        <span className="font-medium">{item.rating} Stars</span>
                        <Badge variant="outline">{getRatingLabel(item.rating)}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{item.count}</span>
                        <Badge variant="outline">
                          {item.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews Trend</CardTitle>
              <CardDescription>
                Daily review activity over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={recentReviewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="rating" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution Analysis</CardTitle>
              <CardDescription>
                How your reviews are distributed across ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={ratingDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Rated Products</CardTitle>
              <CardDescription>
                Products with the highest customer ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topRatedProducts.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.topRatedProducts.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="productTitle" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgRating" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {stats.topRatedProducts.slice(0, 9).map((product, index) => (
                      <div key={product.productId} className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-bold mb-1">{product.avgRating.toFixed(1)}</div>
                        <p className="text-sm font-medium mb-2">{product.productTitle}</p>
                        <Badge variant="outline" className="text-xs">
                          {product.reviewCount} reviews
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No products with sufficient reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                Latest customer feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentReviews.map((review) => (
                  <div key={review._id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {review.userId.avatar ? (
                          <img
                            src={review.userId.avatar}
                            alt={review.userId.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{review.userId.fullName}</p>
                          <p className="text-sm text-muted-foreground">{review.productId.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.review}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewAnalyticsPage;
