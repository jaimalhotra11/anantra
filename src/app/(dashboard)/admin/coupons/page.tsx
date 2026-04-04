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
  Tag,
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Search, 
  Filter,
  Calendar,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Power,
  PowerOff,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  createdAt: string;
  updatedAt: string;
}

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
}

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(discountTypeFilter !== "all" && { discountType: discountTypeFilter }),
        ...(statusFilter !== "all" && { isActive: statusFilter === "active" ? "true" : "false" }),
      });

      const response = await fetch(`/api/coupons?${params}`);
      const data = await response.json();

      if (data.success) {
        setCoupons(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch coupons");
      }
    } catch (error) {
      toast.error("Error fetching coupons");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/coupons/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [pagination.currentPage, searchQuery, discountTypeFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
        fetchStats();
      } else {
        toast.error(data.error || "Failed to delete coupon");
      }
    } catch (error) {
      toast.error("Error deleting coupon");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCoupons.length === 0) {
      toast.error("Please select coupons first");
      return;
    }

    try {
      const response = await fetch("/api/coupons/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          couponIds: selectedCoupons,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Coupons ${action}d successfully`);
        setSelectedCoupons([]);
        fetchCoupons();
        fetchStats();
      } else {
        toast.error(data.error || `Failed to ${action} coupons`);
      }
    } catch (error) {
      toast.error(`Error performing ${action} action`);
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else {
      return `₹${coupon.discountValue.toFixed(2)}`;
    }
  };

  const formatDiscountType = (type: string) => {
    return type === 'percentage' ? 'Percentage' : 'Fixed Amount';
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalCoupons}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
              <Power className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.overview.activeCoupons}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.overview.totalUsage}</div>
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
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Manage discount coupons and promotions
          </p>
        </div>
        <Link href="/admin/coupons/create">
          <Button>
            <Tag className="mr-2 h-4 w-4" />
            Add Coupon
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={discountTypeFilter} onValueChange={setDiscountTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedCoupons.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedCoupons.length} items selected
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
            onClick={() => handleBulkAction("activate")}
          >
            Activate Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction("deactivate")}
          >
            Deactivate Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedCoupons([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCoupons(coupons.map(c => c._id));
                      } else {
                        setSelectedCoupons([]);
                      }
                    }}
                    checked={selectedCoupons.length === coupons.length && coupons.length > 0}
                  />
                </TableHead>
                <TableHead>Coupon Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading coupons...
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No coupons found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell>
                      <Checkbox
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCoupons([...selectedCoupons, coupon._id]);
                          } else {
                            setSelectedCoupons(selectedCoupons.filter(id => id !== coupon._id));
                          }
                        }}
                        checked={selectedCoupons.includes(coupon._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono font-semibold text-lg">{coupon.code}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {new Date(coupon.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {coupon.discountType === 'percentage' ? (
                          <Percent className="h-4 w-4 text-blue-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-semibold">{formatDiscount(coupon)}</span>
                        {coupon.minOrderAmount && (
                          <div className="text-xs text-muted-foreground">
                            Min: ₹{coupon.minOrderAmount}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatDiscountType(coupon.discountType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{coupon.usedCount}</span>
                          {coupon.usageLimit && (
                            <span className="text-sm text-muted-foreground">
                              / {coupon.usageLimit}
                            </span>
                          )}
                        </div>
                        <Badge variant={getUsageStatus(coupon).variant as any}>
                          {getUsageStatus(coupon).label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                        </div>
                        {isCouponExpired(coupon.validUntil) && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {coupon.isActive && !isCouponExpired(coupon.validUntil) ? (
                          <>
                            <Power className="h-4 w-4 text-green-600" />
                            <Badge variant="default">Active</Badge>
                          </>
                        ) : (
                          <>
                            <PowerOff className="h-4 w-4 text-red-600" />
                            <Badge variant="destructive">
                              {isCouponExpired(coupon.validUntil) ? "Expired" : "Inactive"}
                            </Badge>
                          </>
                        )}
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
                            <Link href={`/admin/coupons/${coupon._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/coupons/${coupon._id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteCoupon(coupon._id)}
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

export default CouponsPage;
