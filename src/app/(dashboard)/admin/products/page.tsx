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
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  Image as ImageIcon,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Product {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  services: string[];
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  variants: {
    _id: string;
    skuCode: string;
    price: number;
    cuttedPrice?: number;
    images: string[];
    trackQuantity: boolean;
    stockQuantity?: number;
    isActive?: boolean
  }[];
  createdAt: string;
  updatedAt: string;
}

interface ProductStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalVariants: number;
  outOfStockVariants: number;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
      });

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch products");
      }
    } catch (error) {
      toast.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/products/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data.overview);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
        fetchStats();
      } else {
        toast.error(data.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Error deleting product");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error("Please select products first");
      return;
    }

    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          productIds: selectedProducts,
          ...(action === "updateStatus" && { data: { status: "archived" } }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Products ${action}d successfully`);
        setSelectedProducts([]);
        fetchProducts();
        fetchStats();
      } else {
        toast.error(data.error || `Failed to ${action} products`);
      }
    } catch (error) {
      toast.error(`Error performing ${action} action`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "secondary", label: "Draft" },
      published: { variant: "default", label: "Published" },
      archived: { variant: "destructive", label: "Archived" },
    };
    
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config?.variant as any || "default"}>{config?.label || "Unknown"}</Badge>;
  };

  const getMinPrice = (variants: Product['variants']) => {
    if (!variants || !Array.isArray(variants) || variants.length === 0) return 0;
    return Math.min(...variants.map(v => v.price));
  };

  const getStockStatus = (variants: Product['variants']) => {
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return { status: "No Variants", color: "text-gray-500" };
    }
    
    const activeVariants = variants.filter(v => v.isActive);
    if (activeVariants.length === 0) return { status: "No Variants", color: "text-gray-500" };
    
    const inStock = activeVariants.some(v => !v.trackQuantity || v.stockQuantity! > 0);
    return { 
      status: inStock ? "In Stock" : "Out of Stock", 
      color: inStock ? "text-green-600" : "text-red-600" 
    };
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.publishedProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.draftProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVariants}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and variants
          </p>
        </div>
        <Link href="/admin/products/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="clothing">Clothing</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
            <SelectItem value="books">Books</SelectItem>
            <SelectItem value="home">Home & Garden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedProducts.length} items selected
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
            onClick={() => handleBulkAction("updateStatus")}
          >
            Archive Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedProducts([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts(products.map(p => p._id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                    checked={selectedProducts.length === products.length && products.length > 0}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No products found</p>
                      <Link href="/admin/products/create">
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add your first product
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const variants = product.variants || [];
                  const stockStatus = getStockStatus(variants);
                  const minPrice = getMinPrice(variants);
                  const maxPrice = variants.length > 0 ? Math.max(...variants.map(v => v.price)) : 0;
                  
                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <Checkbox
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts([...selectedProducts, product._id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter((id: string) => id !== product._id));
                            }
                          }}
                          checked={selectedProducts.includes(product._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {variants[0]?.images[0] ? (
                            <img
                              src={variants[0].images[0]}
                              alt={product.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{product.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {variants.length} variants
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.category ? (
                            <Badge variant="outline">
                              {product.category.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No Category</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{variants.length} total</div>
                          <div className="text-muted-foreground">
                            {variants.length > 0 && variants.filter(v => v.isActive).length} active
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          ₹{minPrice.toFixed(2)}
                          {minPrice !== maxPrice && (
                            <span className="text-muted-foreground">
                              {" "} - ₹{maxPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(product.createdAt).toLocaleDateString()}
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
                              <Link href={`/admin/products/${product._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/products/${product._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
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

export default ProductsPage;
