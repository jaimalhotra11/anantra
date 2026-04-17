"use client";



import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { 

  Dialog,

  DialogContent,

  DialogHeader,

  DialogTitle,

  DialogTrigger,

} from "@/components/ui/dialog";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";

import { 

  Plus, 

  Edit, 

  Trash2, 

  MoreHorizontal, 

  Grid3X3,

  Image as ImageIcon,

  ExternalLink,

  Upload,

  RefreshCw

} from "lucide-react";

import { toast } from "sonner";

import { FileUpload } from "@/components/ui/file-upload";



interface Category {

  categoryName: string;

  categoryImage?: string;

}



interface StoreSettings {

  browseByCategory?: {

    category1?: Category;

    category2?: Category;

    category3?: Category;

    category4?: Category;

    category5?: Category;

  };

}



interface BrowseByCategoryManagerProps {

  settings: StoreSettings | null;

  onUpdate: (updatedSettings: Partial<StoreSettings>) => void;

}



const BrowseByCategoryManager = ({ settings, onUpdate }: BrowseByCategoryManagerProps) => {

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [editingCategoryNumber, setEditingCategoryNumber] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);



  const categories = [

    { number: 1, data: settings?.browseByCategory?.category1, label: "Category 1" },

    { number: 2, data: settings?.browseByCategory?.category2, label: "Category 2" },

    { number: 3, data: settings?.browseByCategory?.category3, label: "Category 3" },

    { number: 4, data: settings?.browseByCategory?.category4, label: "Category 4" },

    { number: 5, data: settings?.browseByCategory?.category5, label: "Category 5" },

  ];



  const handleEditCategory = (categoryNumber: number) => {

    const categoryData = settings?.browseByCategory?.[`category${categoryNumber}` as keyof typeof settings.browseByCategory];

    setEditingCategory(categoryData || { categoryName: "", categoryImage: "" });

    setEditingCategoryNumber(categoryNumber);

    setIsDialogOpen(true);

  };



  const handleDeleteCategory = async (categoryNumber: number) => {

    if (!confirm(`Are you sure you want to delete Category ${categoryNumber}?`)) return;



    try {

      const response = await fetch(`/api/settings/browse-by-category/${categoryNumber}`, {

        method: "DELETE",

      });



      const data = await response.json();



      if (data.success) {

        const updatedSettings = {

          ...settings,

          browseByCategory: {

            ...settings?.browseByCategory,

            [`category${categoryNumber}`]: undefined

          }

        };

        onUpdate(updatedSettings);

        toast.success(`Category ${categoryNumber} deleted successfully`);

      } else {

        toast.error(data.error || "Failed to delete category");

      }

    } catch (error) {

      toast.error("Error deleting category");

    }

  };



  const handleSaveCategory = async () => {

    if (!editingCategory || !editingCategoryNumber) return;



    if (!editingCategory.categoryName.trim()) {

      toast.error("Category name is required");

      return;

    }



    try {

      setSaving(true);

      const formData = new FormData();

      formData.append('category', JSON.stringify(editingCategory));

      

      // Handle file upload

      if (editingCategory.categoryImage && editingCategory.categoryImage.startsWith('data:')) {

        // Convert data URL to blob

        const response = await fetch(editingCategory.categoryImage);

        const blob = await response.blob();

        formData.append('categoryImage', blob, 'category-image.jpg');

      }



      const response = await fetch(`/api/settings/browse-by-category/${editingCategoryNumber}`, {

        method: "PUT",

        body: formData,

      });



      const data = await response.json();



      if (data.success) {

        const updatedSettings = {

          ...settings,

          browseByCategory: {

            ...settings?.browseByCategory,

            [`category${editingCategoryNumber}`]: editingCategory

          }

        };

        onUpdate(updatedSettings);

        setIsDialogOpen(false);

        setEditingCategory(null);

        setEditingCategoryNumber(null);

        toast.success(`Category ${editingCategoryNumber} updated successfully`);

      } else {

        toast.error(data.error || "Failed to save category");

      }

    } catch (error) {

      toast.error("Error saving category");

    } finally {

      setSaving(false);

    }

  };



  const handleSaveAllCategories = async () => {

    try {

      const response = await fetch("/api/settings/browse-by-category", {

        method: "PUT",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify(settings?.browseByCategory || {}),

      });



      const data = await response.json();



      if (data.success) {

        toast.success("All categories updated successfully");

      } else {

        toast.error(data.error || "Failed to update categories");

      }

    } catch (error) {

      toast.error("Error updating categories");

    }

  };



  const configuredCount = categories.filter(cat => cat.data).length;



  return (

    <div className="space-y-4">

      <div className="flex items-center justify-between">

        <div className="text-sm text-muted-foreground">

          {configuredCount} of {categories.length} categories configured

        </div>

        <div className="flex items-center gap-2">

          <Button variant="outline" onClick={handleSaveAllCategories}>

            Save All Changes

          </Button>

        </div>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {categories.map((category) => (

          <Card key={category.number} className={category.data ? '' : 'border-dashed'}>

            <CardHeader>

              <div className="flex items-center justify-between">

                <CardTitle className="text-lg">{category.label}</CardTitle>

                <DropdownMenu>

                  <DropdownMenuTrigger asChild>

                    <Button variant="ghost" size="sm">

                      <MoreHorizontal className="h-4 w-4" />

                    </Button>

                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">

                    <DropdownMenuItem onClick={() => handleEditCategory(category.number)}>

                      <Edit className="mr-2 h-4 w-4" />

                      {category.data ? "Edit" : "Configure"}

                    </DropdownMenuItem>

                    {category.data && (

                      <DropdownMenuItem

                        className="text-destructive"

                        onClick={() => handleDeleteCategory(category.number)}

                      >

                        <Trash2 className="mr-2 h-4 w-4" />

                        Delete

                      </DropdownMenuItem>

                    )}

                  </DropdownMenuContent>

                </DropdownMenu>

              </div>

            </CardHeader>

            <CardContent>

              {category.data ? (

                <div className="space-y-3">

                  <div>

                    <h4 className="font-medium">{category.data.categoryName}</h4>

                  </div>

                  

                  {category.data.categoryImage && (

                    <div className="space-y-2">

                      <div className="text-sm font-medium">Category Image</div>

                      <div className="relative group">

                        <img

                          src={category.data.categoryImage}

                          alt={category.data.categoryName}

                          className="w-full h-32 object-cover rounded-md"

                          onError={(e) => {

                            (e.target as HTMLImageElement).style.display = 'none';

                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');

                          }}

                        />

                        <div className="hidden w-full h-32 bg-muted rounded-md flex items-center justify-center">

                          <ImageIcon className="h-8 w-8 text-muted-foreground" />

                        </div>

                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">

                          <a

                            href={category.data.categoryImage}

                            target="_blank"

                            rel="noopener noreferrer"

                            className="text-white"

                          >

                            <ExternalLink className="h-6 w-6" />

                          </a>

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              ) : (

                <div className="flex flex-col items-center justify-center py-8 text-center">

                  <Grid3X3 className="h-8 w-8 text-muted-foreground mb-2" />

                  <p className="text-sm text-muted-foreground mb-3">

                    Not configured

                  </p>

                  <Button

                    variant="outline"

                    size="sm"

                    onClick={() => handleEditCategory(category.number)}

                  >

                    <Plus className="mr-2 h-4 w-4" />

                    Configure

                  </Button>

                </div>

              )}

            </CardContent>

          </Card>

        ))}

      </div>



      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle>

              {editingCategoryNumber ? `Edit Category ${editingCategoryNumber}` : "Add Category"}

            </DialogTitle>

          </DialogHeader>

          <div className="space-y-4">

            <div className="space-y-2">

              <Label htmlFor="categoryName">Category Name *</Label>

              <Input

                id="categoryName"

                placeholder="e.g., Men's Clothing, Women's Shoes"

                value={editingCategory?.categoryName || ""}

                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, categoryName: e.target.value } : null)}

              />

            </div>

            

            <div className="space-y-2">

              <Label>Category Image</Label>

              <FileUpload

                images={editingCategory?.categoryImage ? [editingCategory.categoryImage] : []}

                onImagesChange={(images) => setEditingCategory(prev => prev ? { ...prev, categoryImage: images[0] || "" } : null)}

                maxImages={1}

              />

            </div>



            <div className="flex justify-end gap-2">

              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>

                Cancel

              </Button>

              <Button onClick={handleSaveCategory} disabled={saving}>

                {saving ? (

                  <>

                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />

                    Saving...

                  </>

                ) : (

                  <>

                    Save Category

                  </>

                )}

              </Button>

            </div>

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

};



export default BrowseByCategoryManager;

