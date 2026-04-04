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
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Package,
  Eye,
  EyeOff,
  Copy,
  Power,
  PowerOff,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  usagePerUser?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableProductIds?: Array<{
    _id: string;
    title: string;
    slug: string;
  }>;
  applicableCategoryIds?: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface CouponStats {
  overview: {
    totalCoupons: number;
    activeCoupons: number;
    totalUsage: number;
    usageRate: number;
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
}

const CouponDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [stats, setStats] = useState<CouponStats | null>(null);

  const fetchCoupon = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coupons/${couponId}`);
      const data = await response.json();

      if (data.success) {
        setCoupon(data.data);
      } else {
        toast.error(data.error || "Failed to fetch coupon");
        router.push("/admin/coupons");
      }
    } catch (error) {
      toast.error("Error fetching coupon");
      router.push("/admin/coupons");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch("/api/coupons/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (couponId) {
      fetchCoupon();
      fetchStats();
    }
  }, [couponId]);

  const handleDeleteCoupon = async () => {
    if (!confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Coupon deleted successfully");
        router.push("/admin/coupons");
      } else {
        toast.error(data.error || "Failed to delete coupon");
      }
    } catch (error) {
      toast.error("Error deleting coupon");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else {
      return `₹${coupon.discountValue.toFixed(2)}`;
    }
  };

  const getUsageStatus = (coupon: Coupon) => {
    if (!coupon.usageLimit) return { variant: "secondary", label: "Unlimited" };
    const percentage = (coupon.usedCount / coupon.usageLimit) * 100;
    if (percentage >= 90) return { variant: "destructive", label: "Almost Used" };
    if (percentage >= 50) return { variant: "default", label: "Half Used" };
    return { variant: "outline", label: "Available" };
  };

  const isCouponExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const isCouponActive = (coupon: Coupon) => {
    return coupon.isActive && 
           new Date() >= new Date(coupon.validFrom) && 
           new Date() <= new Date(coupon.validUntil);
  };

  if (loading) {
    return (
      <div className="mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="mx-auto space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Coupon not found</p>
          <Link href="/admin/coupons">
            <Button className="mt-4">Back to Coupons</Button>
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
          <Link href="/admin/coupons">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Coupons
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coupon Details</h1>
            <p className="text-muted-foreground">
              Detailed information about coupon {coupon.code}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/coupons/${coupon._id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Coupon
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDeleteCoupon}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="applicability">Applicability</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coupon Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Coupon Information</CardTitle>
                <CardDescription>
                  Basic details and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Coupon Code</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-mono font-bold">{coupon.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(coupon.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant={isCouponActive(coupon) ? "default" : "destructive"}>
                    {isCouponActive(coupon) ? "Active" : isCouponExpired(coupon.validUntil) ? "Expired" : "Inactive"}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Discount Type</p>
                    <div className="flex items-center gap-2 mt-1">
                      {coupon.discountType === 'percentage' ? (
                        <Percent className="h-4 w-4 text-blue-600" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-semibold">{formatDiscount(coupon)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Usage</p>
                    <div className="mt-1">
                      <span className="font-semibold">{coupon.usedCount}</span>
                      {coupon.usageLimit && (
                        <span className="text-sm text-muted-foreground">
                          {" "} / {coupon.usageLimit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {coupon.minOrderAmount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum Order Amount</p>
                    <p className="mt-1 font-semibold">₹{coupon.minOrderAmount.toFixed(2)}</p>
                  </div>
                )}

                {coupon.maxDiscountAmount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Maximum Discount Amount</p>
                    <p className="mt-1 font-semibold">₹{coupon.maxDiscountAmount.toFixed(2)}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valid From</p>
                    <p className="mt-1">{new Date(coupon.validFrom).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    <p className="mt-1">{new Date(coupon.validUntil).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Usage Status</p>
                  <div className="mt-1">
                    <Badge variant={getUsageStatus(coupon).variant as any}>
                      {getUsageStatus(coupon).label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  Performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{coupon.usedCount}</p>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                </div>

                {coupon.usageLimit && (
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">
                      {Math.round((coupon.usedCount / coupon.usageLimit) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Usage Rate</p>
                  </div>
                )}

                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">
                    {Math.ceil((new Date(coupon.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-sm text-muted-foreground">Days Left</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
              <CardDescription>
                System information about this coupon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Coupon ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {coupon._id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(coupon._id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="mt-1">{new Date(coupon.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{new Date(coupon.updatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Usage Per User</p>
                  <p className="mt-1">{coupon.usagePerUser || "Unlimited"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-6">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.overview.totalUsage}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.overview.usageRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.performance.avgUsagePerCoupon.toFixed(1)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.revenue.totalRevenueFromCouponOrders.toFixed(0)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage by Date</CardTitle>
                  <CardDescription>
                    Daily usage trends for the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.analytics.usageByDate.slice(-7).map((usage, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{new Date(usage.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{usage.count} uses</Badge>
                          <Badge variant="secondary">{usage.uniqueCoupons} coupons</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Applicability Tab */}
        <TabsContent value="applicability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle>Applicable Products</CardTitle>
                <CardDescription>
                  Products this coupon can be applied to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coupon.applicableProductIds && coupon.applicableProductIds.length > 0 ? (
                  <div className="space-y-2">
                    {coupon.applicableProductIds.map((product) => (
                      <div key={product._id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">{product.slug}</p>
                        </div>
                        <Link href={`/admin/products/${product._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">This coupon applies to all products</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Applicable Categories</CardTitle>
                <CardDescription>
                  Categories this coupon can be applied to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0 ? (
                  <div className="space-y-2">
                    {coupon.applicableCategoryIds.map((category) => (
                      <div key={category._id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.slug}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">This coupon applies to all categories</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Applicability Info */}
          <Card>
            <CardHeader>
              <CardTitle>Applicability Rules</CardTitle>
              <CardDescription>
                How this coupon is applied
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Scope</p>
                    <p className="text-sm text-muted-foreground">
                      {(!coupon.applicableProductIds || coupon.applicableProductIds.length === 0) &&
                       (!coupon.applicableCategoryIds || coupon.applicableCategoryIds.length === 0) ?
                        "This coupon applies to all products in the store." :
                        "This coupon is restricted to specific products and/or categories."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Priority</p>
                    <p className="text-sm text-muted-foreground">
                      If both products and categories are specified, the coupon will only apply to products that match either criteria.
                    </p>
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

export default CouponDetailPage;
