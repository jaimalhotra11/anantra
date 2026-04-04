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
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Image as ImageIcon,
  ExternalLink,
  MoveUp,
  MoveDown,
  Upload,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";

interface HeroBanner {
  desktopImg?: string;
  mobileImg?: string;
  link?: string;
}

interface StoreSettings {
  heroBanners: HeroBanner[];
}

interface HeroBannersManagerProps {
  settings: StoreSettings | null;
  onUpdate: (updatedSettings: Partial<StoreSettings>) => void;
}

const HeroBannersManager = ({ settings, onUpdate }: HeroBannersManagerProps) => {
  const [banners, setBanners] = useState<HeroBanner[]>(settings?.heroBanners || []);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddBanner = () => {
    setEditingBanner({ desktopImg: "", mobileImg: "", link: "" });
    setEditIndex(null);
    setIsDialogOpen(true);
  };

  const handleEditBanner = (index: number) => {
    setEditingBanner(banners[index]);
    setEditIndex(index);
    setIsDialogOpen(true);
  };

  const handleDeleteBanner = async (index: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const response = await fetch(`/api/settings/hero-banners/${index}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        const newBanners = banners.filter((_, i) => i !== index);
        setBanners(newBanners);
        onUpdate({ heroBanners: newBanners });
        toast.success("Banner deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete banner");
      }
    } catch (error) {
      toast.error("Error deleting banner");
    }
  };

  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];
    
    try {
      const response = await fetch("/api/settings/hero-banners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBanners),
      });

      const data = await response.json();

      if (data.success) {
        setBanners(newBanners);
        onUpdate({ heroBanners: newBanners });
        toast.success("Banner order updated successfully");
      } else {
        toast.error(data.error || "Failed to update banner order");
      }
    } catch (error) {
      toast.error("Error updating banner order");
    }
  };

  const handleSaveBanner = async () => {
    if (!editingBanner) return;

    try {
      setSaving(true);
      let response;
      
      if (editIndex !== null) {
        // Update existing banner
        const formData = new FormData();
        formData.append('banner', JSON.stringify(editingBanner));
        
        // Handle file uploads
        if (editingBanner.desktopImg && editingBanner.desktopImg.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(editingBanner.desktopImg);
          const blob = await response.blob();
          formData.append('desktopImg', blob, 'desktop-image.jpg');
        }
        
        if (editingBanner.mobileImg && editingBanner.mobileImg.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(editingBanner.mobileImg);
          const blob = await response.blob();
          formData.append('mobileImg', blob, 'mobile-image.jpg');
        }
        
        response = await fetch(`/api/settings/hero-banners/${editIndex}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        // Add new banner
        const formData = new FormData();
        formData.append('banner', JSON.stringify(editingBanner));
        
        // Handle file uploads
        if (editingBanner.desktopImg && editingBanner.desktopImg.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(editingBanner.desktopImg);
          const blob = await response.blob();
          formData.append('desktopImg', blob, 'desktop-image.jpg');
        }
        
        if (editingBanner.mobileImg && editingBanner.mobileImg.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(editingBanner.mobileImg);
          const blob = await response.blob();
          formData.append('mobileImg', blob, 'mobile-image.jpg');
        }
        
        response = await fetch("/api/settings/hero-banners", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();

      if (data.success) {
        const newBanners = editIndex !== null 
          ? banners.map((banner, index) => index === editIndex ? editingBanner : banner)
          : [...banners, editingBanner];
        
        setBanners(newBanners);
        onUpdate({ heroBanners: newBanners });
        setIsDialogOpen(false);
        setEditingBanner(null);
        setEditIndex(null);
        toast.success(editIndex !== null ? "Banner updated successfully" : "Banner added successfully");
      } else {
        toast.error(data.error || "Failed to save banner");
      }
    } catch (error) {
      toast.error("Error saving banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {banners.length} banner{banners.length !== 1 ? 's' : ''} configured
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddBanner}>
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editIndex !== null ? "Edit Banner" : "Add New Banner"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Desktop Image</Label>
                <FileUpload
                  images={editingBanner?.desktopImg ? [editingBanner.desktopImg] : []}
                  onImagesChange={(images) => setEditingBanner(prev => prev ? { ...prev, desktopImg: images[0] || "" } : null)}
                  maxImages={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Image</Label>
                <FileUpload
                  images={editingBanner?.mobileImg ? [editingBanner.mobileImg] : []}
                  onImagesChange={(images) => setEditingBanner(prev => prev ? { ...prev, mobileImg: images[0] || "" } : null)}
                  maxImages={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Banner Link URL</Label>
                <Input
                  id="link"
                  placeholder="https://example.com/product"
                  value={editingBanner?.link || ""}
                  onChange={(e) => setEditingBanner(prev => prev ? { ...prev, link: e.target.value } : null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBanner} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {editIndex !== null ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      {editIndex !== null ? "Update" : "Add"} Banner
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No banners configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first hero banner to start customizing your homepage
            </p>
            <Button onClick={handleAddBanner}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Desktop Image</TableHead>
                  <TableHead>Mobile Image</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">#{index + 1}</div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveBanner(index, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveBanner(index, 'down')}
                            disabled={index === banners.length - 1}
                          >
                            <MoveDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {banner.desktopImg ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={banner.desktopImg}
                            alt="Desktop preview"
                            className="w-12 h-8 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {banner.desktopImg}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {banner.mobileImg ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={banner.mobileImg}
                            alt="Mobile preview"
                            className="w-12 h-8 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {banner.mobileImg}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {banner.link ? (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {banner.link}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBanner(index)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteBanner(index)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HeroBannersManager;
