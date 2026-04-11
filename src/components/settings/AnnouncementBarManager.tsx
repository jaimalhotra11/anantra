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
  MessageSquare,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { toast } from "sonner";

interface StoreSettings {
  _id?: string;
  announcementBar?: string[];
}

interface AnnouncementBarManagerProps {
  settings: StoreSettings | null;
  onUpdate: (updatedSettings: Partial<StoreSettings>) => void;
}

const AnnouncementBarManager = ({ settings, onUpdate }: AnnouncementBarManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [announcementText, setAnnouncementText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const announcements = settings?.announcementBar || [];

  const resetForm = () => {
    setAnnouncementText("");
    setEditingIndex(null);
    setIsDialogOpen(false);
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setAnnouncementText("");
    setIsDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setAnnouncementText(announcements[index]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!announcementText.trim()) {
      toast.error("Announcement text is required");
      return;
    }

    setIsSubmitting(true);

    try {
      let updatedAnnouncements = [...announcements];

      if (editingIndex !== null) {
        // Update existing announcement
        updatedAnnouncements[editingIndex] = announcementText.trim();
        toast.success("Announcement updated successfully");
      } else {
        // Add new announcement
        updatedAnnouncements.push(announcementText.trim());
        toast.success("Announcement added successfully");
      }

      onUpdate({ announcementBar: updatedAnnouncements });
      resetForm();
    } catch (error) {
      toast.error("Failed to save announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (index: number) => {
    try {
      const updatedAnnouncements = announcements.filter((_, i) => i !== index);
      onUpdate({ announcementBar: updatedAnnouncements });
      toast.success("Announcement deleted successfully");
    } catch (error) {
      toast.error("Failed to delete announcement");
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const updatedAnnouncements = [...announcements];
    [updatedAnnouncements[index], updatedAnnouncements[index - 1]] = 
    [updatedAnnouncements[index - 1], updatedAnnouncements[index]];
    
    onUpdate({ announcementBar: updatedAnnouncements });
  };

  const handleMoveDown = (index: number) => {
    if (index === announcements.length - 1) return;
    
    const updatedAnnouncements = [...announcements];
    [updatedAnnouncements[index], updatedAnnouncements[index + 1]] = 
    [updatedAnnouncements[index + 1], updatedAnnouncements[index]];
    
    onUpdate({ announcementBar: updatedAnnouncements });
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage announcements that will rotate in the announcement bar. These will be displayed at the top of your store.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Edit Announcement" : "Add New Announcement"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="announcementText">Announcement Text</Label>
                <Input
                  id="announcementText"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Enter your announcement message..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting 
                    ? (editingIndex !== null ? "Updating..." : "Adding...") 
                    : (editingIndex !== null ? "Update" : "Add")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements Table */}
      {announcements.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Announcements ({announcements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Announcement Text</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="max-w-md truncate" title={announcement}>
                        {announcement}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleMoveUp(index)} disabled={index === 0}>
                            <MoveUp className="mr-2 h-4 w-4" />
                            Move Up
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoveDown(index)} disabled={index === announcements.length - 1}>
                            <MoveDown className="mr-2 h-4 w-4" />
                            Move Down
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(index)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(index)}
                            className="text-red-600"
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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first announcement to get started with the announcement bar feature.
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Announcement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnnouncementBarManager;
