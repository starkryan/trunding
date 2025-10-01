"use client";

import { useState } from "react";
import MobileLayout from "@/components/mobile-layout";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Share, Heart, Edit, Save, X } from "lucide-react";

export default function NativeHeaderDemo() {
  const [isEditing, setIsEditing] = useState(false);
  const [transparent, setTransparent] = useState(false);

  const handleBack = () => {
    console.log("Back button clicked");
    // Custom back navigation logic
  };

  const customActions = (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8 md:h-9 md:w-9"
        onClick={() => setIsEditing(!isEditing)}
      >
        {isEditing ? (
          <Save className="h-5 w-5 md:h-6 md:w-6" />
        ) : (
          <Edit className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8 md:h-9 md:w-9"
      >
        <Share className="h-5 w-5 md:h-6 md:w-6" />
      </Button>
    </>
  );

  return (
    <MobileLayout
      showHeader={true}
      showNavigation={false}
      headerProps={{
        title: isEditing ? "Edit Profile" : "Profile",
        subtitle: isEditing ? "Make changes and save" : "john.doe@example.com",
        showBack: true,
        centerTitle: false,
        actions: customActions,
        onBack: handleBack,
        transparent: transparent
      }}
      safeArea={true}
      fullHeight={true}
    >
      <div className="p-4 space-y-4">
        {/* Demo Controls */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Header Controls</h3>
            <div className="space-y-2">
              <Button
                variant={transparent ? "default" : "outline"}
                size="sm"
                onClick={() => setTransparent(!transparent)}
                className="w-full"
              >
                {transparent ? "Make Header Opaque" : "Make Header Transparent"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="w-full"
              >
                Toggle Edit Mode
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Header Variations Showcase */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Header Variations</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium mb-1">Simple Header</p>
                <p className="text-xs text-muted-foreground">Clean title with back button</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium mb-1">Header with Subtitle</p>
                <p className="text-xs text-muted-foreground">Title + description text</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium mb-1">Header with Actions</p>
                <p className="text-xs text-muted-foreground">Custom action buttons</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium mb-1">Transparent Header</p>
                <p className="text-xs text-muted-foreground">Content shows behind header</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Profile Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <p className="font-medium">John Doe</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">john.doe@example.com</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Member Since</label>
                <p className="font-medium">January 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-10">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="h-10">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scrollable Content */}
        <div className="space-y-2 pb-8">
          {Array.from({ length: 10 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <h4 className="font-medium">List Item {i + 1}</h4>
                <p className="text-sm text-muted-foreground">
                  This is a sample list item to demonstrate scrolling behavior.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}