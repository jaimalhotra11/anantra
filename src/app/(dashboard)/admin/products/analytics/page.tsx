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
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Box,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductStats {
  overview: {
    totalProducts: number;
    publishedProducts: number;
    draftProducts: number;
    archivedProducts: number;
    recentProducts: number;
  };
  variants: {
    totalVariants: number;
    activeVariants: number;
    outOfStockVariants: number;
  };
  pricing: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    medianPrice: number;
  };
  services: Array<{
    _id: string;
    count: number;
  }>;
  distributions: {
    status: Array<{
      _id: string;
      count: number;
    }>;
    stock: Array<{
      _id: string;
      count: number;
    }>;
    priceRanges: Array<{
      _id: string;
      count: number;
    }>;
  };
  period: {
    days: number;
    fromDate: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ProductAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  const fetchStats = async (days?: number) => {
    try {
      if (days) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = days ? `?days=${days}` : "";
      const response = await fetch(`/api/products/stats${params}`);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      published: '#10b981',
      draft: '#f59e0b',
      archived: '#ef4444',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getStockColor = (status: string) => {
    const colors = {
      'in-stock': '#10b981',
      'low-stock': '#f59e0b',
      'out-of-stock': '#ef4444',
      'not-tracked': '#6b7280',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getPriceRangeLabel = (range: string) => {
    const labels = {
      '0': '₹0 - ₹2,500',
      '50': '₹2,500 - ₹5,000',
      '100': '₹5,000 - ₹10,000',
      '200': '₹10,000 - ₹25,000',
      '500': '₹25,000 - ₹50,000',
      'other': '₹50,000+',
    };
    return labels[range as keyof typeof labels] || range;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
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

  const statusData = stats.distributions.status.map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count,
    color: getStatusColor(item._id),
  }));

  const stockData = stats.distributions.stock.map(item => ({
    name: item._id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: item.count,
    color: getStockColor(item._id),
  }));

  const priceRangeData = stats.distributions.priceRanges.map(item => ({
    name: getPriceRangeLabel(item._id),
    value: item.count,
  }));

  const serviceData = stats.services.map(item => ({
    name: item._id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your product catalog
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
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.recentProducts} in last {stats.period.days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.overview.publishedProducts}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.overview.publishedProducts / stats.overview.totalProducts) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.variants.totalVariants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.variants.activeVariants} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.variants.outOfStockVariants}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.variants.outOfStockVariants / stats.variants.totalVariants) * 100).toFixed(1)}% of variants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="flex flex-col space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Analysis</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Product Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of products by their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stock Status */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Status Distribution</CardTitle>
                <CardDescription>
                  Overview of variant stock levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stockData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stockData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Price Range Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Price Range Distribution</CardTitle>
              <CardDescription>
                How your products are distributed across price ranges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceRangeData}>
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

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>
                  Detailed view of product statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{item.value}</span>
                        <Badge variant="outline">
                          {((item.value / stats.overview.totalProducts) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Status Details</CardTitle>
                <CardDescription>
                  Variant stock level analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{item.value}</span>
                        <Badge variant="outline">
                          {((item.value / stats.variants.totalVariants) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Summary</CardTitle>
                <CardDescription>
                  Key pricing metrics across all products
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum Price</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(stats.pricing.minPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maximum Price</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatPrice(stats.pricing.maxPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Price</p>
                    <p className="text-2xl font-bold">
                      {formatPrice(stats.pricing.avgPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Median Price</p>
                    <p className="text-2xl font-bold">
                      {formatPrice(stats.pricing.medianPrice)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Range Analysis</CardTitle>
                <CardDescription>
                  Distribution of products across price ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={priceRangeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Usage</CardTitle>
              <CardDescription>
                How often different services are used across products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={serviceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {serviceData.map((item) => (
                        <div key={item.name} className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-sm text-muted-foreground">{item.name}</p>
                          <Badge variant="outline" className="mt-2">
                            {((item.value / stats.overview.totalProducts) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No services data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductAnalyticsPage;
