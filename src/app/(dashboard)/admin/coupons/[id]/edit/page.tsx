"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Package,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Product {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface CouponFormData {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usagePerUser?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
}

const EditCouponPage = () => {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderAmount: undefined,
    maxDiscountAmount: undefined,
    usageLimit: undefined,
    usagePerUser: undefined,
    validFrom: "",
    validUntil: "",
    isActive: true,
    applicableProductIds: [],
    applicableCategoryIds: [],
  });

  const fetchCoupon = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/coupons/${couponId}`);
      const data = await response.json();

      if (data.success) {
        const coupon = data.data;
        setFormData({
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          usageLimit: coupon.usageLimit,
          usagePerUser: coupon.usagePerUser,
          validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
          validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
          isActive: coupon.isActive,
          applicableProductIds: coupon.applicableProductIds?.map((p: any) => typeof p === 'string' ? p : p._id) || [],
          applicableCategoryIds: coupon.applicableCategoryIds?.map((c: any) => typeof c === 'string' ? c : c._id) || [],
        });
        setOriginalData(coupon);
      } else {
        toast.error(data.error || "Failed to fetch coupon");
        router.push("/admin/coupons");
      }
    } catch (error) {
      toast.error("Error fetching coupon");
      router.push("/admin/coupons");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch("/api/products?limit=50&status=published");
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

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (couponId) {
      fetchCoupon();
      fetchProducts();
      fetchCategories();
    }
  }, [couponId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    if (formData.minOrderAmount && formData.minOrderAmount < 0) {
      toast.error("Minimum order amount cannot be negative");
      return;
    }

    if (formData.maxDiscountAmount && formData.maxDiscountAmount < 0) {
      toast.error("Maximum discount amount cannot be negative");
      return;
    }

    if (formData.usageLimit && formData.usageLimit < 1) {
      toast.error("Usage limit must be at least 1");
      return;
    }

    if (formData.usagePerUser && formData.usagePerUser < 1) {
      toast.error("Usage per user must be at least 1");
      return;
    }

    if (!formData.validFrom || !formData.validUntil) {
      toast.error("Valid from and valid until dates are required");
      return;
    }

    if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      toast.error("Valid until date must be after valid from date");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Coupon updated successfully!");
        router.push("/admin/coupons");
      } else {
        toast.error(data.error || "Failed to update coupon");
      }
    } catch (error) {
      toast.error("Error updating coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      applicableProductIds: checked
        ? [...prev.applicableProductIds, productId]
        : prev.applicableProductIds.filter(id => id !== productId),
    }));
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      applicableCategoryIds: checked
        ? [...prev.applicableCategoryIds, categoryId]
        : prev.applicableCategoryIds.filter(id => id !== categoryId),
    }));
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    } else {
      return `₹${value.toFixed(2)}`;
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Coupon</h1>
            <p className="text-muted-foreground">
              Update coupon configuration
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/coupons")}
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
                Update Coupon
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the basic coupon details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Enter coupon code"
                  className="font-mono uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, discountType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Percentage
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Fixed Amount
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Discount Value ({formData.discountType === 'percentage' ? '%' : '₹'}) *
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  step={formData.discountType === 'percentage' ? 1 : 0.01}
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minOrderAmount || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscountAmount">Maximum Discount Amount (₹)</Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxDiscountAmount || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                />
                {formData.discountType === 'percentage' && (
                  <p className="text-xs text-muted-foreground">
                    Only applicable for percentage discounts
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>
              Configure how many times this coupon can be used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Total Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={formData.usageLimit || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usagePerUser">Usage Per User</Label>
                <Input
                  id="usagePerUser"
                  type="number"
                  min="1"
                  value={formData.usagePerUser || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, usagePerUser: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validity Period */}
        <Card>
          <CardHeader>
            <CardTitle>Validity Period</CardTitle>
            <CardDescription>
              Set when this coupon is active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked === true }))}
              />
              <Label htmlFor="isActive">Coupon is active</Label>
            </div>
          </CardContent>
        </Card>

        {/* Applicability */}
        <Card>
          <CardHeader>
            <CardTitle>Applicability</CardTitle>
            <CardDescription>
              Restrict this coupon to specific products or categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Note</p>
                  <p className="text-blue-700 mt-1">
                    If no products or categories are selected, this coupon will be applicable to all products.
                  </p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="space-y-3">
              <Label>Applicable Products</Label>
              {productsLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {products.map((product) => (
                    <div key={product._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-${product._id}`}
                        checked={formData.applicableProductIds.includes(product._id)}
                        onCheckedChange={(checked) => handleProductToggle(product._id, checked === true)}
                      />
                      <Label htmlFor={`product-${product._id}`} className="text-sm font-normal cursor-pointer">
                        {product.title}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <Label>Applicable Categories</Label>
              {categoriesLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {categories.map((category) => (
                    <div key={category._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category._id}`}
                        checked={formData.applicableCategoryIds.includes(category._id)}
                        onCheckedChange={(checked) => handleCategoryToggle(category._id, checked === true)}
                      />
                      <Label htmlFor={`category-${category._id}`} className="text-sm font-normal cursor-pointer">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Original Info */}
        <Card>
          <CardHeader>
            <CardTitle>Original Coupon Information</CardTitle>
            <CardDescription>
              Details about the original coupon configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Original Code</p>
                <p className="font-mono mt-1">{originalData.code}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Original Discount</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-medium">{formatDiscount(originalData.discountType, originalData.discountValue)}</span>
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

export default EditCouponPage;
