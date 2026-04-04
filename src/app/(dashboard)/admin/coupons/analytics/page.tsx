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
  Tag,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Percent,
  Calendar,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CouponStats {
  overview: {
    totalCoupons: number;
    activeCoupons: number;
    inactiveCoupons: number;
    percentageCoupons: number;
    fixedCoupons: number;
    totalUsage: number;
    usageRate: number;
  };
  distribution: {
    avgDiscountValue: number;
    maxDiscountValue: number;
    minDiscountValue: number;
    totalUsedCount: number;
  };
  performance: {
    totalCoupons: number;
    totalUsages: number;
    avgUsagePerCoupon: number;
    unusedCoupons: number;
    highlyUsedCoupons: number;
    unusedRate: number;
    highlyUsedRate: number;
  };
  revenue: {
    totalOrdersWithCoupons: number;
    totalRevenueFromCouponOrders: number;
    avgOrderValueWithCoupon: number;
    totalDiscountGiven: number;
    avgDiscountPerOrder: number;
  };
  analytics: {
    recentCoupons: Array<{
      _id: string;
      code: string;
      discountType: string;
      discountValue: number;
      usedCount: number;
      usageLimit?: number;
      isActive: boolean;
      createdAt: string;
    }>;
    topUsedCoupons: Array<{
      code: string;
      discountType: string;
      discountValue: number;
      usedCount: number;
      usageLimit?: number;
      totalUsages: number;
      uniqueUsers: number;
      totalRevenue: number;
      totalDiscountGiven: number;
    }>;
    usageByDate: Array<{
      date: string;
      count: number;
      uniqueCoupons: number;
    }>;
    userUsageStats: Array<{
      userId: string;
      userFullName: string;
      userEmail: string;
      usageCount: number;
      uniqueCoupons: number;
      totalSavings: number;
      lastUsage: string;
    }>;
  };
  period: {
    days: number | null;
    fromDate: string | null;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CouponAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  const fetchStats = async (days?: number) => {
    try {
      if (days) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = days ? `?days=${days}` : "";
      const response = await fetch(`/api/coupons/stats${params}`);
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

  const discountTypeData = [
    { name: 'Percentage', value: stats.overview.percentageCoupons, color: '#0088FE' },
    { name: 'Fixed Amount', value: stats.overview.fixedCoupons, color: '#00C49F' },
  ];

  const statusData = [
    { name: 'Active', value: stats.overview.activeCoupons, color: '#00C49F' },
    { name: 'Inactive', value: stats.overview.inactiveCoupons, color: '#FF8042' },
  ];

  const performanceData = [
    { name: 'Unused', value: stats.performance.unusedCoupons, color: '#FFBB28' },
    { name: 'Used', value: stats.performance.totalCoupons - stats.performance.unusedCoupons, color: '#00C49F' },
    { name: 'Highly Used', value: stats.performance.highlyUsedCoupons, color: '#0088FE' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupon Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into coupon performance and usage
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
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalCoupons}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.activeCoupons} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.overview.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.usageRate.toFixed(1)}% usage rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{stats.revenue.totalRevenueFromCouponOrders.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.revenue.totalOrdersWithCoupons} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.performance.avgUsagePerCoupon.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg usage per coupon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="flex flex-col space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discount Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of coupon types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={discountTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {discountTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>
                  Active vs inactive coupons
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
          </div>

          {/* Usage Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Trend</CardTitle>
              <CardDescription>
                Daily coupon usage over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.analytics.usageByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discount Value Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Value Analysis</CardTitle>
                <CardDescription>
                  Distribution of discount values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Discount</span>
                    <span className="text-2xl font-bold">
                      {stats.distribution.avgDiscountValue.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Maximum Discount</span>
                    <span className="text-lg font-semibold">
                      {stats.distribution.maxDiscountValue}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Minimum Discount</span>
                    <span className="text-lg font-semibold">
                      {stats.distribution.minDiscountValue}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>
                  How coupons are performing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Zap className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.performance.highlyUsedCoupons}</p>
                  <p className="text-sm text-muted-foreground">Highly Used Coupons</p>
                  <Badge variant="outline" className="mt-2">
                    {stats.performance.highlyUsedRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Package className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.performance.unusedCoupons}</p>
                  <p className="text-sm text-muted-foreground">Unused Coupons</p>
                  <Badge variant="outline" className="mt-2">
                    {stats.performance.unusedRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Target className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{stats.performance.avgUsagePerCoupon.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Avg Usage per Coupon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Coupons</CardTitle>
              <CardDescription>
                Coupons with the highest usage and revenue impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.analytics.topUsedCoupons.slice(0, 10).map((coupon, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{coupon.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{coupon.totalUsages}</p>
                      <p className="text-sm text-muted-foreground">uses</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Detailed usage patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Impact */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">
                      ₹{stats.revenue.totalRevenueFromCouponOrders.toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Tag className="h-8 w-8 mx-auto text-red-600 mb-2" />
                    <p className="text-2xl font-bold">
                      ₹{stats.revenue.totalDiscountGiven.toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Discount Given</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">{stats.revenue.totalOrdersWithCoupons}</p>
                    <p className="text-sm text-muted-foreground">Orders with Coupons</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <p className="text-2xl font-bold">
                      ₹{stats.revenue.avgOrderValueWithCoupon.toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  </div>
                </div>

                {/* Top Users */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Users by Coupon Usage</h3>
                  <div className="space-y-2">
                    {stats.analytics.userUsageStats.slice(0, 5).map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{user.userFullName}</p>
                          <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{user.usageCount}</p>
                          <p className="text-sm text-muted-foreground">uses</p>
                        </div>
                      </div>
                    ))}
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

export default CouponAnalyticsPage;
