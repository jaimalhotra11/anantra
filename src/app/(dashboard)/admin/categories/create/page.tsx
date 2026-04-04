"use client";

import { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  Save,
  FolderOpen,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  parentCategory?: string;
  order: number;
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

const CreateCategoryPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    image: "",
    isActive: true,
    parentCategory: "",
    order: 0,
  });

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch("/api/categories?limit=100");
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
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Category created successfully!");
        router.push("/admin/categories");
      } else {
        toast.error(data.error || "Failed to create category");
      }
    } catch (error) {
      toast.error("Error creating category");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Create Category</h1>
            <p className="text-muted-foreground">
              Create a new product category
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
                Creating...
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Category
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
              Add an image to represent this category
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

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Category Preview</CardTitle>
            <CardDescription>
              Review your category before creating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Name:</span>
                <span className="font-semibold">{formData.name || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Slug:</span>
                <code className="bg-background px-2 py-1 rounded text-sm">
                  {formData.slug || "N/A"}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Parent:</span>
                <span className="text-sm">
                  {formData.parentCategory 
                    ? categories.find(c => c._id === formData.parentCategory)?.name || "Unknown"
                    : "No Parent"
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={formData.isActive ? "default" : "secondary"}>
                  {formData.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreateCategoryPage;
