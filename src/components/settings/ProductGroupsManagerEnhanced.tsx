"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Package,
  Eye,
  Link2,
  Search,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  images: string[];
}

interface ProductGroup {
  name: string;
  description?: string;
  products: string[];
}

interface StoreSettings {
  productGroup1?: ProductGroup;
  productGroup2?: ProductGroup;
}

interface ProductGroupsManagerProps {
  settings: StoreSettings | null;
  onUpdate: (updatedSettings: Partial<StoreSettings>) => void;
}

const ProductGroupsManager = ({ settings, onUpdate }: ProductGroupsManagerProps) => {
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroupNumber, setEditingGroupNumber] = useState<1 | 2 | null>(null);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  const groups = [
    { number: 1 as const, data: settings?.productGroup1, label: "Product Group 1" },
    { number: 2 as const, data: settings?.productGroup2, label: "Product Group 2" },
  ];

  // Search products
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setAvailableProducts([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableProducts(data.products || []);
      } else {
        toast.error("Failed to search products");
        setAvailableProducts([]);
      }
    } catch (error) {
      toast.error("Error searching products");
      setAvailableProducts([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(productSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleEditGroup = (groupNumber: 1 | 2) => {
    const groupData = groupNumber === 1 ? settings?.productGroup1 : settings?.productGroup2;
    setEditingGroup(groupData || { name: "", description: "", products: [] });
    setEditingGroupNumber(groupNumber);
    setIsDialogOpen(true);
    setShowProductSelector(false);
    setProductSearch("");
    setAvailableProducts([]);
  };

  const handleDeleteGroup = async (groupNumber: 1 | 2) => {
    if (!confirm(`Are you sure you want to delete Product Group ${groupNumber}?`)) return;

    try {
      const response = await fetch(`/api/settings/product-groups/${groupNumber}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        const updatedSettings = {
          ...settings,
          [`productGroup${groupNumber}`]: undefined
        };
        onUpdate(updatedSettings);
        toast.success(`Product Group ${groupNumber} deleted successfully`);
      } else {
        toast.error(data.error || "Failed to delete product group");
      }
    } catch (error) {
      toast.error("Error deleting product group");
    }
  };

  const handleSaveGroup = async () => {
    if (!editingGroup || !editingGroupNumber) return;

    if (!editingGroup.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/settings/product-groups/${editingGroupNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingGroup),
      });

      const data = await response.json();

      if (data.success) {
        const updatedSettings = {
          ...settings,
          [`productGroup${editingGroupNumber}`]: editingGroup
        };
        onUpdate(updatedSettings);
        setIsDialogOpen(false);
        setEditingGroup(null);
        setEditingGroupNumber(null);
        setShowProductSelector(false);
        setProductSearch("");
        setAvailableProducts([]);
        toast.success(`Product Group ${editingGroupNumber} updated successfully`);
      } else {
        toast.error(data.error || "Failed to save product group");
      }
    } catch (error) {
      toast.error("Error saving product group");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    if (!editingGroup) return;
    
    if (editingGroup.products.includes(product.slug)) {
      toast.error("Product already added to this group");
      return;
    }

    setEditingGroup(prev => prev ? {
      ...prev,
      products: [...prev.products, product.slug]
    } : null);
    toast.success(`Added "${product.name}" to group`);
  };

  const handleRemoveProduct = (index: number) => {
    if (!editingGroup) return;
    
    setEditingGroup(prev => prev ? {
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    } : null);
  };

  const openProductSelector = () => {
    setShowProductSelector(true);
    setProductSearch("");
    setAvailableProducts([]);
  };

  const closeProductSelector = () => {
    setShowProductSelector(false);
    setProductSearch("");
    setAvailableProducts([]);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <Card key={group.number} className={group.data ? '' : 'border-dashed'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.label}</CardTitle>
                <div className="flex items-center gap-2">
                  {group.data && (
                    <Badge variant="secondary">
                      {group.data.products.length} products
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditGroup(group.number)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {group.data ? "Edit" : "Configure"}
                      </DropdownMenuItem>
                      {group.data && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteGroup(group.number)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.data ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{group.data.name}</h4>
                    {group.data.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.data.description}
                      </p>
                    )}
                  </div>
                  
                  {group.data.products.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Products ({group.data.products.length})</div>
                      <div className="flex flex-wrap gap-1">
                        {group.data.products.slice(0, 3).map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                        {group.data.products.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{group.data.products.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No products configured
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditGroup(group.number)}
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

      {/* Edit Group Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroupNumber ? `Edit Product Group ${editingGroupNumber}` : "Add Product Group"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                placeholder="e.g., Featured Products, New Arrivals"
                value={editingGroup?.name || ""}
                onChange={(e) => setEditingGroup(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupDescription">Description</Label>
              <Textarea
                id="groupDescription"
                placeholder="Brief description of this product group"
                value={editingGroup?.description || ""}
                onChange={(e) => setEditingGroup(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
              />
            </div>

            {/* Product Selection Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Products</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={showProductSelector ? closeProductSelector : openProductSelector}
                  className="min-w-[120px]"
                >
                  {showProductSelector ? (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      View Current
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Add Products
                    </>
                  )}
                </Button>
              </div>

              {showProductSelector ? (
                /* Product Search Interface */
                <div className="border rounded-md p-3 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                    {searching && (
                      <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Search Results */}
                  {productSearch && (
                    <div className="max-h-[200px] overflow-y-auto border rounded-md">
                      {availableProducts.length > 0 ? (
                        <div className="p-2 space-y-1">
                          {availableProducts.map((product) => (
                            <div
                              key={product._id}
                              className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                              onClick={() => handleAddProduct(product)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {product.images && product.images.length > 0 && (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="h-10 w-10 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {product.category} • ${product.price}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={editingGroup?.products.includes(product.slug)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          {searching ? "Searching..." : "No products found"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Current Products List */
                <div className="border rounded-md p-3">
                  {editingGroup?.products && editingGroup.products.length > 0 ? (
                    <div className="space-y-2">
                      {editingGroup.products.map((productSlug, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate">{productSlug}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-4">
                      <Package className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        No products added yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click "Add Products" to search and add products to this group
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSaveGroup} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Group
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

export default ProductGroupsManager;
