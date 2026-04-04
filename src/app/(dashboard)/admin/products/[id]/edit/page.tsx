"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Package,
  DollarSign,
  Box,
  Save,
  ArrowLeft,
  Copy,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Variant {
  _id?: string;
  id: string;
  skuCode: string;
  attributes: { name: string; value: string }[];
  images: string[];
  price: number;
  cuttedPrice?: number;
  trackQuantity: boolean;
  stockQuantity: number;
  isActive: boolean;
}

interface ProductFormData {
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  services: string[];
  slug: string;
  category?: string;
  defaultVariantId: string;
  variants: Variant[];
}

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [originalData, setOriginalData] = useState<ProductFormData | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    status: "draft",
    services: [],
    slug: "",
    category: "",
    defaultVariantId: "",
    variants: [],
  });

  const availableServices = [
    { id: "free-delivery", label: "Free Delivery" },
    { id: "cash-on-delivery", label: "Cash on Delivery" },
    { id: "replacement", label: "Replacement" },
  ];

  const commonAttributes = [
    "Size", "Color", "Material", "Style", "Fit", "Pattern", 
    "Length", "Sleeve", "Neckline", "Brand", "Occasion"
  ];

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const fetchProduct = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        const product = data.data;
        const formattedData: ProductFormData = {
          title: product.title,
          description: product.description,
          status: product.status,
          services: product.services || [],
          slug: product.slug,
          category: product.category?._id || "",
          defaultVariantId: product.defaultVariantId || "",
          variants: product.variants.map((v: any) => ({
            ...v,
            id: v._id,
          })),
        };
        
        setFormData(formattedData);
        setOriginalData(formattedData);
      } else {
        toast.error(data.error || "Failed to fetch product");
        router.push("/admin/products");
      }
    } catch (error) {
      toast.error("Error fetching product");
      router.push("/admin/products");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch("/api/categories?limit=100&isActive=true");
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        toast.error(data.error || "Failed to fetch categories");
      }
    } catch (error) {
      toast.error("Error fetching categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchCategories();
    }
  }, [productId]);

  const handleTitleChange = (value: string) => {
    const slug = generateSlug(value);
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: value ? slug : prev.slug,
    }));
  };

  const addVariant = useCallback(() => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      skuCode: "",
      attributes: formData.variants[0]?.attributes.map(attr => ({ ...attr, value: "" })) || [{ name: "Size", value: "" }],
      images: [],
      price: formData.variants[0]?.price || 0,
      cuttedPrice: undefined,
      trackQuantity: false,
      stockQuantity: 0,
      isActive: true,
    };
    
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  }, [formData.variants]);

  const removeVariant = (variantId: string) => {
    if (formData.variants.length <= 1) {
      toast.error("Product must have at least one variant");
      return;
    }

    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId),
      defaultVariantId: prev.defaultVariantId === variantId ? prev.variants.find(v => v.id !== variantId)?.id || "" : prev.defaultVariantId,
    }));
  };

  const updateVariant = (variantId: string, updates: Partial<Variant>) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => 
        v.id === variantId ? { ...v, ...updates } : v
      ),
    }));
  };

  const addAttribute = (variantId: string) => {
    const variant = formData.variants.find(v => v.id === variantId);
    if (variant && variant.attributes.length < 5) {
      updateVariant(variantId, {
        attributes: [...variant.attributes, { name: "", value: "" }],
      });
    } else {
      toast.error("Maximum 5 attributes allowed per variant");
    }
  };

  const removeAttribute = (variantId: string, attrIndex: number) => {
    const variant = formData.variants.find(v => v.id === variantId);
    if (variant && variant.attributes.length > 1) {
      updateVariant(variantId, {
        attributes: variant.attributes.filter((_, index) => index !== attrIndex),
      });
    } else {
      toast.error("Variant must have at least one attribute");
    }
  };

  const duplicateVariant = (variantId: string) => {
    const variant = formData.variants.find(v => v.id === variantId);
    if (variant) {
      const newVariant: Variant = {
        ...variant,
        id: Date.now().toString(),
        skuCode: `${variant.skuCode}-copy`,
        attributes: variant.attributes.map(attr => ({ ...attr })),
        images: [...variant.images],
        _id: undefined, // Remove _id for new variants
      };
      
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, newVariant],
      }));
      
      toast.success("Variant duplicated successfully");
    }
  };

  const handleImageUpload = (variantId: string, images: string[]) => {
    updateVariant(variantId, { images });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error("Product title is required");
      setActiveTab("basic");
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error("Product description is required");
      setActiveTab("basic");
      return;
    }
    
    if (!formData.slug.trim()) {
      toast.error("Product slug is required");
      setActiveTab("basic");
      return;
    }

    // Validate variants
    for (const variant of formData.variants) {
      if (!variant.skuCode.trim()) {
        toast.error("All variants must have a SKU code");
        setActiveTab("variants");
        return;
      }
      
      if (variant.price <= 0) {
        toast.error("All variants must have a valid price");
        setActiveTab("variants");
        return;
      }
      
      for (const attr of variant.attributes) {
        if (!attr.name.trim() || !attr.value.trim()) {
          toast.error("All variant attributes must have name and value");
          setActiveTab("variants");
          return;
        }
      }
    }

    // Check for duplicate SKUs
    const skuCodes = formData.variants.map(v => v.skuCode.trim().toLowerCase());
    const uniqueSkus = new Set(skuCodes);
    if (skuCodes.length !== uniqueSkus.size) {
      toast.error("Duplicate SKU codes found. Each variant must have a unique SKU.");
      setActiveTab("variants");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        variants: formData.variants.map(({ _id, id, ...variant }) => ({
          ...variant,
          _id: _id || id, // Use existing _id or fallback to id
        })),
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Product updated successfully!");
        router.push("/admin/products");
      } else {
        toast.error(data.error || "Failed to update product");
      }
    } catch (error) {
      toast.error("Error updating product");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className=" mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!originalData) {
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

  return (
    <div className=" mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground">
              Update product information and variants
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/products")}
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
                Update Product
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>
                  Basic details about your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter product title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="product-url-slug"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your product..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category || "none"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value === "none" ? undefined : value }))}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Services</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {availableServices.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={service.id}
                          checked={formData.services.includes(service.id)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              services: checked
                                ? [...prev.services, service.id]
                                : prev.services.filter(s => s !== service.id),
                            }));
                          }}
                        />
                        <Label htmlFor={service.id} className="text-sm">
                          {service.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variants Tab */}
          <TabsContent value="variants" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Product Variants</h3>
                <p className="text-sm text-muted-foreground">
                  Manage different versions of your product (sizes, colors, etc.)
                </p>
              </div>
              <Button onClick={addVariant} type="button">
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <Card key={variant.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Variant {index + 1}
                        {variant._id && (
                          <Badge variant="outline" className="ml-2">
                            Existing
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateVariant(variant.id)}
                          type="button"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {formData.variants.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeVariant(variant.id)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>SKU Code *</Label>
                        <Input
                          value={variant.skuCode}
                          onChange={(e) => updateVariant(variant.id, { skuCode: e.target.value })}
                          placeholder="SKU-001"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (₹) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price}
                          onChange={(e) => updateVariant(variant.id, { price: parseFloat(e.target.value) || 0 })}
                          placeholder="99.99"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sale Price (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.cuttedPrice || ""}
                          onChange={(e) => updateVariant(variant.id, { 
                            cuttedPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                          })}
                          placeholder="149.99"
                        />
                      </div>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Attributes</Label>
                        {variant.attributes.length < 5 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addAttribute(variant.id)}
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                            Add Attribute
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {variant.attributes.map((attr, attrIndex) => (
                          <div key={attrIndex} className="flex items-center gap-2">
                            <Select
                              value={attr.name}
                              onValueChange={(value) => {
                                const newAttributes = [...variant.attributes];
                                newAttributes[attrIndex] = { ...attr, name: value };
                                updateVariant(variant.id, { attributes: newAttributes });
                              }}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Attribute" />
                              </SelectTrigger>
                              <SelectContent>
                                {commonAttributes.map((commonAttr) => (
                                  <SelectItem key={commonAttr} value={commonAttr}>
                                    {commonAttr}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">Custom...</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {attr.name === "custom" ? (
                              <Input
                                placeholder="Custom attribute name"
                                value={attr.name === "custom" ? "" : attr.name}
                                onChange={(e) => {
                                  const newAttributes = [...variant.attributes];
                                  newAttributes[attrIndex] = { ...attr, name: e.target.value };
                                  updateVariant(variant.id, { attributes: newAttributes });
                                }}
                                className="flex-1"
                              />
                            ) : (
                              <Input
                                placeholder="Value"
                                value={attr.value}
                                onChange={(e) => {
                                  const newAttributes = [...variant.attributes];
                                  newAttributes[attrIndex] = { ...attr, value: e.target.value };
                                  updateVariant(variant.id, { attributes: newAttributes });
                                }}
                                className="flex-1"
                                required
                              />
                            )}
                            
                            {variant.attributes.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAttribute(variant.id, attrIndex)}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-3">
                      <Label>Product Images</Label>
                      <FileUpload
                        images={variant.images}
                        onImagesChange={(images) => handleImageUpload(variant.id, images)}
                        maxImages={5}
                      />
                    </div>

                    {/* Stock Management */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`track-${variant.id}`}
                          checked={variant.trackQuantity}
                          onCheckedChange={(checked) => 
                            updateVariant(variant.id, { trackQuantity: !!checked })
                          }
                        />
                        <Label htmlFor={`track-${variant.id}`}>Track Quantity</Label>
                      </div>
                      
                      {variant.trackQuantity && (
                        <div className="space-y-2">
                          <Label>Stock Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.stockQuantity}
                            onChange={(e) => updateVariant(variant.id, { 
                              stockQuantity: parseInt(e.target.value) || 0 
                            })}
                            placeholder="0"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`active-${variant.id}`}
                          checked={variant.isActive}
                          onCheckedChange={(checked) => 
                            updateVariant(variant.id, { isActive: !!checked })
                          }
                        />
                        <Label htmlFor={`active-${variant.id}`}>Active</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Settings</CardTitle>
                <CardDescription>
                  Configure additional product options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published' | 'archived') =>
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.variants.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="defaultVariant">Default Variant</Label>
                    <Select
                      value={formData.defaultVariantId}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, defaultVariantId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.variants.map((variant, index) => (
                          <SelectItem key={variant.id} value={variant.id}>
                            Variant {index + 1} - {variant.skuCode || "No SKU"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default EditProductPage;
