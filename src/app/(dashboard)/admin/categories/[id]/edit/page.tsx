"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Save,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  parentCategory?: {
    _id: string;
    name: string;
    slug: string;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  parentCategory?: string;
  order: number;
}

const EditCategoryPage = () => {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [originalData, setOriginalData] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    image: "",
    isActive: true,
    parentCategory: "",
    order: 0,
  });

  const fetchCategory = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/categories/${categoryId}`);
      const data = await response.json();

      if (data.success) {
        const category = data.data;
        setFormData({
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          image: category.image || "",
          isActive: category.isActive,
          parentCategory: category.parentCategory?._id || "",
          order: category.order,
        });
        setOriginalData(category);
      } else {
        toast.error(data.error || "Failed to fetch category");
        router.push("/admin/categories");
      }
    } catch (error) {
      toast.error("Error fetching category");
      router.push("/admin/categories");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch("/api/categories?limit=100");
      const data = await response.json();

      if (data.success) {
        setCategories(data.data.filter((cat: Category) => cat._id !== categoryId));
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
    if (categoryId) {
      fetchCategory();
      fetchCategories();
    }
  }, [categoryId]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Category slug is required");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error("Slug must contain only lowercase letters, numbers, and hyphens");
      return;
    }

    if (formData.order < 0) {
      toast.error("Order must be non-negative");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Category updated successfully!");
        router.push("/admin/categories");
      } else {
        toast.error(data.error || "Failed to update category");
      }
    } catch (error) {
      toast.error("Error updating category");
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground">Category not found</p>
          <Link href="/admin/categories">
            <Button className="mt-4">Back to Categories</Button>
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
          <Link href="/admin/categories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
            <p className="text-muted-foreground">
              Update category configuration
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/categories")}
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
                Update Category
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
              Configure the basic category details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="category-slug"
                  className="font-mono lowercase"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentCategory">Parent Category</Label>
                <Select
                  value={formData.parentCategory || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentCategory: value === "none" ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent (Root Category)</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>Category Image</CardTitle>
            <CardDescription>
              Update the category image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL of the category image
              </p>
            </div>

            {formData.image && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4">
                  <img
                    src={formData.image}
                    alt="Category preview"
                    className="w-full h-48 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-image.jpg";
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure category settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked === true }))}
              />
              <Label htmlFor="isActive">Category is active</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Inactive categories won't be shown in the frontend
            </p>
          </CardContent>
        </Card>

        {/* Original Info */}
        <Card>
          <CardHeader>
            <CardTitle>Original Category Information</CardTitle>
            <CardDescription>
              Details about the original category configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Original Name</p>
                <p className="mt-1">{originalData.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Original Slug</p>
                <p className="mt-1 font-mono">{originalData.slug}</p>
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

export default EditCategoryPage;
