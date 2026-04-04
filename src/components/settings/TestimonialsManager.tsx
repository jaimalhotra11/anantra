"use client";

import { useState } from "react";
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
  MessageSquare,
  Star,
  User,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Upload,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";

interface Review {
  customerName: string;
  customerProfile?: string;
  customerMessage: string;
  customerRating: number;
}

interface Testimonials {
  testimonialSectionHeading?: string;
  testimonialSectionDescription?: string;
  reviews?: Review[];
}

interface StoreSettings {
  testimonials?: Testimonials;
}

interface TestimonialsManagerProps {
  settings: StoreSettings | null;
  onUpdate: (updatedSettings: Partial<StoreSettings>) => void;
}

const TestimonialsManager = ({ settings, onUpdate }: TestimonialsManagerProps) => {
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [sectionInfo, setSectionInfo] = useState<Testimonials>({
    testimonialSectionHeading: settings?.testimonials?.testimonialSectionHeading || "",
    testimonialSectionDescription: settings?.testimonials?.testimonialSectionDescription || ""
  });

  const reviews = settings?.testimonials?.reviews || [];

  const handleAddReview = () => {
    setEditingReview({
      customerName: "",
      customerMessage: "",
      customerRating: 5,
      customerProfile: ""
    });
    setEditIndex(null);
    setIsReviewDialogOpen(true);
  };

  const handleEditReview = (index: number) => {
    setEditingReview(reviews[index]);
    setEditIndex(index);
    setIsReviewDialogOpen(true);
  };

  const handleDeleteReview = async (index: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`/api/settings/testimonials/reviews/${index}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        const newReviews = reviews.filter((_, i) => i !== index);
        const updatedTestimonials = {
          ...settings?.testimonials,
          reviews: newReviews
        };
        onUpdate({ testimonials: updatedTestimonials });
        toast.success("Review deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete review");
      }
    } catch (error) {
      toast.error("Error deleting review");
    }
  };

  const handleSaveReview = async () => {
    if (!editingReview) return;

    if (!editingReview.customerName.trim() || !editingReview.customerMessage.trim()) {
      toast.error("Customer name and message are required");
      return;
    }

    try {
      setSaving(true);
      let response;
      
      if (editIndex !== null) {
        // Update existing review
        const formData = new FormData();
        formData.append('review', JSON.stringify(editingReview));
        
        // Handle file upload
        if (editingReview.customerProfile && editingReview.customerProfile.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(editingReview.customerProfile);
          const blob = await response.blob();
          formData.append('customerProfile', blob, 'customer-profile.jpg');
        }
        
        response = await fetch(`/api/settings/testimonials/reviews/${editIndex}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        // Add new review
        const formData = new FormData();
        formData.append('review', JSON.stringify(editingReview));
        
        // Handle file upload
        if (editingReview.customerProfile && editingReview.customerProfile.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(editingReview.customerProfile);
          const blob = await response.blob();
          formData.append('customerProfile', blob, 'customer-profile.jpg');
        }
        
        response = await fetch("/api/settings/testimonials/reviews", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();

      if (data.success) {
        const newReviews = editIndex !== null 
          ? reviews.map((review, index) => index === editIndex ? editingReview : review)
          : [...reviews, editingReview];
        
        const updatedTestimonials = {
          ...settings?.testimonials,
          reviews: newReviews
        };
        
        onUpdate({ testimonials: updatedTestimonials });
        setIsReviewDialogOpen(false);
        setEditingReview(null);
        setEditIndex(null);
        toast.success(editIndex !== null ? "Review updated successfully" : "Review added successfully");
      } else {
        toast.error(data.error || "Failed to save review");
      }
    } catch (error) {
      toast.error("Error saving review");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSectionInfo = async () => {
    try {
      setSavingSection(true);
      const response = await fetch("/api/settings/testimonials/section-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sectionInfo),
      });

      const data = await response.json();

      if (data.success) {
        const updatedTestimonials = {
          ...settings?.testimonials,
          ...sectionInfo
        };
        onUpdate({ testimonials: updatedTestimonials });
        setIsSectionDialogOpen(false);
        toast.success("Section info updated successfully");
      } else {
        toast.error(data.error || "Failed to update section info");
      }
    } catch (error) {
      toast.error("Error updating section info");
    } finally {
      setSavingSection(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Section Information</CardTitle>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(true)}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Edit Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium">Heading</div>
              <div className="text-muted-foreground">
                {settings?.testimonials?.testimonialSectionHeading || "Not set"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Description</div>
              <div className="text-muted-foreground">
                {settings?.testimonials?.testimonialSectionDescription || "Not set"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Customer Reviews</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage customer testimonials and reviews
              </p>
            </div>
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddReview}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Review
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editIndex !== null ? "Edit Review" : "Add New Review"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="John Doe"
                      value={editingReview?.customerName || ""}
                      onChange={(e) => setEditingReview(prev => prev ? { ...prev, customerName: e.target.value } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Customer Profile Image</Label>
                    <FileUpload
                      images={editingReview?.customerProfile ? [editingReview.customerProfile] : []}
                      onImagesChange={(images) => setEditingReview(prev => prev ? { ...prev, customerProfile: images[0] || "" } : null)}
                      maxImages={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerRating">Rating *</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingReview(prev => prev ? { ...prev, customerRating: rating } : null)}
                          className={`p-2 ${
                            editingReview?.customerRating === rating
                              ? "bg-yellow-100 border-yellow-400"
                              : ""
                          }`}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              rating <= (editingReview?.customerRating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </Button>
                      ))}
                      <span className="text-sm text-muted-foreground">
                        {editingReview?.customerRating || 0} stars
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerMessage">Customer Message *</Label>
                    <Textarea
                      id="customerMessage"
                      placeholder="Great product! I really loved the quality and design..."
                      value={editingReview?.customerMessage || ""}
                      onChange={(e) => setEditingReview(prev => prev ? { ...prev, customerMessage: e.target.value } : null)}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveReview} disabled={saving}>
                      {saving ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          {editIndex !== null ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        <>
                          {editIndex !== null ? "Update" : "Add"} Review
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add customer testimonials to build trust and credibility
              </p>
              <Button onClick={handleAddReview}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Review
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {review.customerProfile ? (
                          <img
                            src={review.customerProfile}
                            alt={review.customerName}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hidden">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{review.customerName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{renderStars(review.customerRating)}</TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate">
                        {review.customerMessage}
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
                          <DropdownMenuItem onClick={() => handleEditReview(index)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteReview(index)}
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
          )}
        </CardContent>
      </Card>

      {/* Section Info Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Section Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sectionHeading">Section Heading</Label>
              <Input
                id="sectionHeading"
                placeholder="What Our Customers Say"
                value={sectionInfo.testimonialSectionHeading || ""}
                onChange={(e) => setSectionInfo(prev => ({ ...prev, testimonialSectionHeading: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sectionDescription">Section Description</Label>
              <Textarea
                id="sectionDescription"
                placeholder="Real reviews from our valued customers"
                value={sectionInfo.testimonialSectionDescription || ""}
                onChange={(e) => setSectionInfo(prev => ({ ...prev, testimonialSectionDescription: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)} disabled={savingSection}>
                Cancel
              </Button>
              <Button onClick={handleSaveSectionInfo} disabled={savingSection}>
                {savingSection ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Section Info
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

export default TestimonialsManager;
