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
  Package,
  DollarSign,
  Box,
  Image as ImageIcon,
  Truck,
  Shield,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  _id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  services: string[];
  slug: string;
  defaultVariantId?: string;
  variants: {
    _id: string;
    skuCode: string;
    attributes: { name: string; value: string }[];
    images: string[];
    price: number;
    cuttedPrice?: number;
    trackQuantity: boolean;
    stockQuantity: number;
    isActive: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

const ProductDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  const serviceIcons = {
    "free-delivery": Truck,
    "cash-on-delivery": DollarSign,
    "replacement": RotateCcw,
  };

  const serviceLabels = {
    "free-delivery": "Free Delivery",
    "cash-on-delivery": "Cash on Delivery",
    "replacement": "Replacement Available",
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "secondary", label: "Draft" },
      published: { variant: "default", label: "Published" },
      archived: { variant: "destructive", label: "Archived" },
    };
    
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      } else {
        toast.error(data.error || "Failed to fetch product");
        router.push("/admin/products");
      }
    } catch (error) {
      toast.error("Error fetching product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Product deleted successfully");
        router.push("/admin/products");
      } else {
        toast.error(data.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Error deleting product");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const getStockStatus = (variant: Product['variants'][0]) => {
    if (!variant.isActive) {
      return { status: "Inactive", color: "text-gray-500" };
    }
    
    if (!variant.trackQuantity) {
      return { status: "Not Tracked", color: "text-blue-600" };
    }
    
    if (variant.stockQuantity === 0) {
      return { status: "Out of Stock", color: "text-red-600" };
    }
    
    if (variant.stockQuantity <= 10) {
      return { status: `Low Stock (${variant.stockQuantity})`, color: "text-yellow-600" };
    }
    
    return { status: `In Stock (${variant.stockQuantity})`, color: "text-green-600" };
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className=" mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className=" mx-auto space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Product not found</p>
          <Link href="/admin/products">
            <Button className="mt-4">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultVariant = product.variants.find(v => v._id === product.defaultVariantId) || product.variants[0];
  const minPrice = Math.min(...product.variants.map(v => v.price));
  const maxPrice = Math.max(...product.variants.map(v => v.price));

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(product.status)}
              <span className="text-sm text-muted-foreground">
                Created {new Date(product.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/${product._id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDeleteProduct}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Image */}
            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
              </CardHeader>
              <CardContent>
                {defaultVariant?.images[0] ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={defaultVariant.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{product.title}</h3>
                  <p className="text-muted-foreground mt-2">{product.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price Range</p>
                    <p className="text-lg font-semibold">
                      {minPrice === maxPrice 
                        ? formatPrice(minPrice)
                        : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Variants</p>
                    <p className="text-lg font-semibold">
                      {product.variants.length} total ({product.variants.filter(v => v.isActive).length} active)
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {product.services.length > 0 ? (
                      product.services.map((service) => {
                        const Icon = serviceIcons[service as keyof typeof serviceIcons];
                        return (
                          <Badge key={service} variant="outline" className="flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {serviceLabels[service as keyof typeof serviceLabels]}
                          </Badge>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No services available</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Slug</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {product.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(product.slug)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Product ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {product._id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(product._id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
              <CardDescription>
                Manage different versions of your product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Attributes</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Images</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((variant) => {
                    const stockStatus = getStockStatus(variant);
                    const isDefault = variant._id === product.defaultVariantId;
                    
                    return (
                      <TableRow key={variant._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{variant.skuCode}</span>
                            {isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {variant.attributes.map((attr, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{attr.name}:</span>
                                <span>{attr.value}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold">{formatPrice(variant.price)}</div>
                            {variant.cuttedPrice && (
                              <div className="text-sm text-muted-foreground line-through">
                                {formatPrice(variant.cuttedPrice)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {variant.isActive ? (
                              <><Eye className="h-4 w-4 text-green-600" /><span className="text-sm">Active</span></>
                            ) : (
                              <><EyeOff className="h-4 w-4 text-gray-400" /><span className="text-sm">Inactive</span></>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{variant.images.length}</span>
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(product.status)}</div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Default Variant</p>
                    <p className="mt-1 font-mono text-xs">
                      {product.defaultVariantId || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="mt-1">{new Date(product.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="mt-1">{new Date(product.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variant Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Variants</p>
                    <p className="mt-1 text-lg font-semibold">{product.variants.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Variants</p>
                    <p className="mt-1 text-lg font-semibold text-green-600">
                      {product.variants.filter(v => v.isActive).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Out of Stock</p>
                    <p className="mt-1 text-lg font-semibold text-red-600">
                      {product.variants.filter(v => 
                        v.isActive && v.trackQuantity && v.stockQuantity === 0
                      ).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Images</p>
                    <p className="mt-1 text-lg font-semibold">
                      {product.variants.reduce((sum, v) => sum + v.images.length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetailPage;
