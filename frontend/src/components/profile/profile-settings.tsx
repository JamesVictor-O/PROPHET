"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface ProfileSettingsProps {
  user: {
    username: string;
    displayName: string;
    email: string;
    bio: string;
  };
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    email: user.email,
    bio: user.bio,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Settings updated:", formData);
  };

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="bg-[#0F172A] border-[#334155]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-[#0F172A] border-[#334155]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="bg-[#0F172A] border-[#334155]"
                placeholder="Tell us about yourself..."
              />
            </div>

            <Button type="submit" className="bg-[#2563EB] hover:bg-blue-700">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="bg-[#1E293B] border-[#334155]">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                className="bg-[#0F172A] border-[#334155]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                className="bg-[#0F172A] border-[#334155]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-[#0F172A] border-[#334155]"
              />
            </div>

            <Button type="submit" className="bg-[#2563EB] hover:bg-blue-700">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

