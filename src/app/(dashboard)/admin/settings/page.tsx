"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Image as ImageIcon, 
  Package, 
  Grid3X3, 
  MessageSquare,
  Volume2,
  Save,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import HeroBannersManager from "@/components/settings/HeroBannersManager";
import ProductGroupsManager from "@/components/settings/ProductGroupsManager";
import TestimonialsManager from "@/components/settings/TestimonialsManager";
import BrowseByCategoryManager from "@/components/settings/BrowseByCategoryManager";
import AnnouncementBarManager from "@/components/settings/AnnouncementBarManager";

interface StoreSettings {
  _id?: string;
  announcementBar?: string[];
  heroBanners: Array<{
    desktopImg?: string;
    mobileImg?: string;
    link?: string;
  }>;
  productGroup1?: {
    name: string;
    description?: string;
    products: string[];
  };
  productGroup2?: {
    name: string;
    description?: string;
    products: string[];
  };
  browseByCategory?: {
    category1?: { categoryName: string; categoryImage?: string };
    category2?: { categoryName: string; categoryImage?: string };
    category3?: { categoryName: string; categoryImage?: string };
    category4?: { categoryName: string; categoryImage?: string };
    category5?: { categoryName: string; categoryImage?: string };
  };
  testimonials?: {
    testimonialSectionHeading?: string;
    testimonialSectionDescription?: string;
    reviews?: Array<{
      customerName: string;
      customerProfile?: string;
      customerMessage: string;
      customerRating: number;
    }>;
  };
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("announcement-bar");
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        toast.error(data.error || "Failed to fetch settings");
      }
    } catch (error) {
      toast.error("Error fetching settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingsUpdate = (updatedSettings: Partial<StoreSettings>) => {
    setSettings(prev => prev ? { ...prev, ...updatedSettings } : null);
  };

  const saveAllSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("All settings saved successfully");
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const getTabIcon = (tabValue: string) => {
    const icons = {
      "announcement-bar": Volume2,
      "hero-banners": ImageIcon,
      "product-groups": Package,
      "browse-category": Grid3X3,
      "testimonials": MessageSquare,
    };
    return icons[tabValue as keyof typeof icons] || Settings;
  };

  const tabs = [
    { value: "announcement-bar", label: "Announcement Bar", description: "Manage announcement messages" },
    { value: "hero-banners", label: "Hero Banners", description: "Manage homepage banners" },
    { value: "product-groups", label: "Product Groups", description: "Configure product showcases" },
    { value: "browse-category", label: "Browse by Category", description: "Setup category display" },
    { value: "testimonials", label: "Testimonials", description: "Manage customer reviews" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground">
            Manage your store's appearance and content settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={saveAllSettings}
            disabled={saving || !settings}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {/* Settings Overview Cards */}
      {settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Announcements</CardTitle>
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.announcementBar?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active announcements</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hero Banners</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.heroBanners?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active banners</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Product Groups</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {[settings.productGroup1, settings.productGroup2].filter(Boolean).length}
              </div>
              <p className="text-xs text-muted-foreground">Configured groups</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(settings.browseByCategory || {}).filter(Boolean).length}
              </div>
              <p className="text-xs text-muted-foreground">Active categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testimonials</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.testimonials?.reviews?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Customer reviews</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Settings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading settings...</span>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
              <TabsList className="grid w-full grid-cols-5">
                {tabs.map((tab) => {
                  const Icon = getTabIcon(tab.value);
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="announcement-bar" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Announcement Bar</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage announcements that will rotate in the announcement bar at the top of your store
                    </p>
                  </div>
                  <AnnouncementBarManager 
                    settings={settings} 
                    onUpdate={handleSettingsUpdate}
                  />
                </div>
              </TabsContent>

              <TabsContent value="hero-banners" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Hero Banners</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage the promotional banners displayed on your homepage
                    </p>
                  </div>
                  <HeroBannersManager 
                    settings={settings} 
                    onUpdate={handleSettingsUpdate}
                  />
                </div>
              </TabsContent>

              <TabsContent value="product-groups" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Product Groups</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure featured product groups for special displays
                    </p>
                  </div>
                  <ProductGroupsManager 
                    settings={settings} 
                    onUpdate={handleSettingsUpdate}
                  />
                </div>
              </TabsContent>

              <TabsContent value="browse-category" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Browse by Category</h3>
                    <p className="text-sm text-muted-foreground">
                      Setup category browsing options for your customers
                    </p>
                  </div>
                  <BrowseByCategoryManager 
                    settings={settings} 
                    onUpdate={handleSettingsUpdate}
                  />
                </div>
              </TabsContent>

              <TabsContent value="testimonials" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Testimonials</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage customer reviews and testimonials
                    </p>
                  </div>
                  <TestimonialsManager 
                    settings={settings} 
                    onUpdate={handleSettingsUpdate}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
