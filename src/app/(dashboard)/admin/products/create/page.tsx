"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Variant {
  id: string;
  skuCode: string;
  attributes: { name: string; value: string }[];
  images: File[];
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
  sizeChartImage?: File;
  defaultVariantId: string;
  variants: Variant[];
  selectedBulkSizes: string[];
}

const CreateProductPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    status: "draft",
    services: [],
    slug: "",
    category: "",
    defaultVariantId: "",
    variants: [
      {
        id: "1",
        skuCode: "",
        attributes: [{ name: "Size", value: "" }],
        images: [],
        price: 0,
        cuttedPrice: undefined,
        trackQuantity: false,
        stockQuantity: 0,
        isActive: true,
      },
    ],
    selectedBulkSizes: [],
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const availableServices = [
    { id: "free-delivery", label: "Free Delivery" },
    { id: "cash-on-delivery", label: "Cash on Delivery" },
    { id: "replacement", label: "Replacement" },
  ];

  const commonAttributes = [
    "Size", "Color", "Material", "Style", "Fit", "Pattern",
    "Length", "Sleeve", "Neckline", "Brand", "Occasion"
  ];

  const predefinedSizes = [
    "Extra Small",
    "Small",
    "Medium",
    "Large",
    "Extra Large",
    "XXL",
    "XXXL",
    "XXXXL",
    "Custom"
  ];

  const predefinedColors = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Red", hex: "#FF0000" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Green", hex: "#00FF00" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Purple", hex: "#800080" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Brown", hex: "#964B00" },
    { name: "Gray", hex: "#808080" },
    { name: "Navy", hex: "#000080" },
    { name: "Maroon", hex: "#800000" },
    { name: "Teal", hex: "#008080" },
    { name: "Beige", hex: "#F5F5DC" },
    { name: "Custom", hex: "" }
  ];

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

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

  const createBulkSizeVariants = () => {
    if (formData.selectedBulkSizes.length === 0) {
      toast.error("Please select at least one size");
      return;
    }

    const templateVariant = formData.variants[0];
    if (!templateVariant) {
      toast.error("No template variant found");
      return;
    }

    const newVariants: Variant[] = formData.selectedBulkSizes.map((size, index) => {
      const variantId = Date.now().toString() + index;
      const sizeAttribute = { name: "Size", value: size };
      const otherAttributes = templateVariant.attributes.filter(attr => attr.name !== "Size");
      
      return {
        id: variantId,
        skuCode: `${templateVariant.skuCode || 'SKU'}-${size.toLowerCase().replace(/\s+/g, '-')}`,
        attributes: [sizeAttribute, ...otherAttributes],
        images: [...templateVariant.images],
        price: templateVariant.price,
        cuttedPrice: templateVariant.cuttedPrice,
        trackQuantity: templateVariant.trackQuantity,
        stockQuantity: templateVariant.stockQuantity,
        isActive: templateVariant.isActive,
      };
    });

    setFormData(prev => ({
      ...prev,
      variants: newVariants,
      defaultVariantId: newVariants[0]?.id || "",
      selectedBulkSizes: [],
    }));

    toast.success(`Created ${newVariants.length} variants for selected sizes`);
  };

  const updateSelectedBulkSizes = (sizes: string[]) => {
    setFormData(prev => ({
      ...prev,
      selectedBulkSizes: sizes,
    }));
  };

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
    setFormData(prev => {
      const updatedVariants = prev.variants.map(v =>
        v.id === variantId ? { ...v, ...updates } : v
      );
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const addAttribute = (variantId: string) => {
    setFormData(prev => {
      const variant = prev.variants.find(v => v.id === variantId);
      if (variant && variant.attributes.length < 5) {
        const updatedVariants = prev.variants.map(v =>
          v.id === variantId ? { ...v, attributes: [...v.attributes, { name: "", value: "" }] } : v
        );
        return {
          ...prev,
          variants: updatedVariants,
        };
      } else {
        toast.error("Maximum 5 attributes allowed per variant");
        return prev;
      }
    });
  };

  const removeAttribute = (variantId: string, attrIndex: number) => {
    setFormData(prev => {
      const variant = prev.variants.find(v => v.id === variantId);
      if (variant && variant.attributes.length > 1) {
        const updatedVariants = prev.variants.map(v =>
          v.id === variantId ? { ...v, attributes: v.attributes.filter((_, index) => index !== attrIndex) } : v
        );
        return {
          ...prev,
          variants: updatedVariants,
        };
      } else {
        toast.error("Variant must have at least one attribute");
        return prev;
      }
    });
  };

  const duplicateVariant = (variantId: string) => {
    const variant = formData.variants.find(v => v.id === variantId);
    if (variant) {
      const newVariant: Variant = {
        ...variant,
        id: Date.now().toString(),
        skuCode: `${variant.skuCode}-copy`,
        attributes: variant.attributes.map(attr => ({ ...attr })),
        images: [...variant.images], // Copy files
      };

      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, newVariant],
      }));

      toast.success("Variant duplicated successfully");
    }
  };

  const handleImageUpload = (variantId: string, files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    updateVariant(variantId, { images: [...formData.variants.find(v => v.id === variantId)?.images || [], ...validFiles] });
  };

  const removeImage = (variantId: string, imageIndex: number) => {
    const variant = formData.variants.find(v => v.id === variantId);
    if (variant) {
      const newImages = variant.images.filter((_, index) => index !== imageIndex);
      updateVariant(variantId, { images: newImages });
    }
  };

  const handleSizeChartImageUpload = (file: File) => {
    const isValidType = file.type.startsWith('image/');
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

    if (!isValidType) {
      toast.error("Size chart must be an image file");
      return;
    }
    if (!isValidSize) {
      toast.error("Size chart image is too large (max 5MB)");
      return;
    }

    setFormData(prev => ({ ...prev, sizeChartImage: file }));
  };

  const removeSizeChartImage = () => {
    setFormData(prev => ({ ...prev, sizeChartImage: undefined }));
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
    fetchCategories();
  }, []);

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
      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add product data as JSON
      const productData = {
        ...formData,
        variants: formData.variants.map(({ id, images, ...variant }) => variant),
        selectedBulkSizes: undefined, // Remove bulk sizes from submission
        sizeChartImage: undefined, // Remove file object, will be added separately
      };
      formDataToSend.append('product', JSON.stringify(productData));

      // Add size chart image if present
      if (formData.sizeChartImage) {
        formDataToSend.append('sizeChartImage', formData.sizeChartImage);
      }

      // Add images for each variant
      formData.variants.forEach((variant) => {
        variant.images.forEach((image, index) => {
          formDataToSend.append(`variant_${variant.skuCode}_image_${index}`, image);
        });
      });

      const response = await fetch("/api/products", {
        method: "POST",
        body: formDataToSend, // Don't set Content-Type header for FormData
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Product created successfully!");
        router.push("/admin/products");
      } else {
        toast.error(data.error || "Failed to create product");
      }
    } catch (error) {
      toast.error("Error creating product");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
            <p className="text-muted-foreground">
              Add a new product to your catalog
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
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs className="flex flex-col" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
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
                  <Label>Size Chart Image</Label>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <label htmlFor="sizeChartImage" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-muted-foreground">
                              Click to upload size chart image
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              PNG, JPG, GIF up to 5MB
                            </span>
                          </label>
                          <input
                            id="sizeChartImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleSizeChartImageUpload(file);
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {formData.sizeChartImage && (
                      <div className="relative group">
                        <img
                          src={URL.createObjectURL(formData.sizeChartImage)}
                          alt="Size chart"
                          className="w-full h-48 object-contain rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={removeSizeChartImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Size Chart: {formData.sizeChartImage.name.length > 20 ? formData.sizeChartImage.name.substring(0, 20) + '...' : formData.sizeChartImage.name}
                        </div>
                      </div>
                    )}
                  </div>
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
          <TabsContent value="variants" className="space-y-6 mt-6">
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
                      <CardTitle className="text-lg">Variant {index + 1}</CardTitle>
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
                        <Label>Price (INR) *</Label>
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
                        <Label>Sale Price (INR)</Label>
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
                        {variant.attributes.map((attr: any, attrIndex) => (
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
                              </SelectContent>
                            </Select>

                            {attr.name === "Size" ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Select
                                  value={attr.value}
                                  onValueChange={(value) => {
                                    const newAttributes = [...variant.attributes];
                                    newAttributes[attrIndex] = { ...attr, value };
                                    updateVariant(variant.id, { attributes: newAttributes });
                                  }}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {predefinedSizes.map((size) => (
                                      <SelectItem key={size} value={size}>
                                        {size}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {attr.value === "Custom" && (
                                  <Input
                                    placeholder="Enter custom size"
                                    value={attr.customSize || ""}
                                    onChange={(e) => {
                                      const newAttributes = [...variant.attributes];
                                      newAttributes[attrIndex] = { ...attr, customSize: e.target.value };
                                      updateVariant(variant.id, { attributes: newAttributes });
                                    }}
                                    className="w-[120px]"
                                  />
                                )}
                              </div>
                            ) : attr.name === "Color" ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Select
                                  value={attr.value}
                                  onValueChange={(value) => {
                                    const newAttributes = [...variant.attributes];
                                    newAttributes[attrIndex] = { ...attr, value };
                                    updateVariant(variant.id, { attributes: newAttributes });
                                  }}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select color" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {predefinedColors.map((color) => (
                                      <SelectItem key={color.name} value={color.name}>
                                        <div className="flex items-center gap-2">
                                          {color.hex && (
                                            <div
                                              className="w-4 h-4 rounded border border-gray-300"
                                              style={{ backgroundColor: color.hex }}
                                            />
                                          )}
                                          {color.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {attr.value === "Custom" && (
                                  <Input
                                    placeholder="#000000"
                                    value={attr.customColor || ""}
                                    onChange={(e) => {
                                      const newAttributes = [...variant.attributes];
                                      newAttributes[attrIndex] = { ...attr, customColor: e.target.value };
                                      updateVariant(variant.id, { attributes: newAttributes });
                                    }}
                                    className="w-[120px]"
                                  />
                                )}
                              </div>
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
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div className="mt-4">
                              <label htmlFor={`images-${variant.id}`} className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-muted-foreground">
                                  Click to upload or drag and drop
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                  PNG, JPG, GIF up to 5MB each (max 5 images)
                                </span>
                              </label>
                              <input
                                id={`images-${variant.id}`}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleImageUpload(variant.id, e.target.files)}
                                className="hidden"
                              />
                            </div>
                          </div>
                        </div>

                        {variant.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {variant.images.map((image, imageIndex) => (
                              <div key={imageIndex} className="relative group">
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Product image ${imageIndex + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(variant.id, imageIndex)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                                  {image.name.length > 10 ? image.name.substring(0, 10) + '...' : image.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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

             {/* Bulk Size Creation */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Quick Size Variant Creation</CardTitle>
                <CardDescription>
                  Select multiple sizes to create variants automatically using the first variant as template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Sizes</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {predefinedSizes.map((size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bulk-size-${size}`}
                          checked={formData.selectedBulkSizes.includes(size)}
                          onCheckedChange={(checked) => {
                            const newSizes = checked
                              ? [...formData.selectedBulkSizes, size]
                              : formData.selectedBulkSizes.filter(s => s !== size);
                            updateSelectedBulkSizes(newSizes);
                          }}
                        />
                        <Label htmlFor={`bulk-size-${size}`} className="text-sm">
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {formData.selectedBulkSizes.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={createBulkSizeVariants}
                      className="text-sm"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Create {formData.selectedBulkSizes.length} Size Variants
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      This will replace current variants
                    </span>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <p className="font-medium mb-1">💡 How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Configure your first variant with images, price, colors, etc.</li>
                    <li>Select multiple sizes above</li>
                    <li>Click "Create X Size Variants" to auto-generate all variants</li>
                    <li>Images and other properties will be copied to all variants</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
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
        </form>
      </Tabs>
    </div>
  );
};

export default CreateProductPage;
