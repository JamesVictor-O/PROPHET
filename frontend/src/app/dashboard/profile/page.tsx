"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock user data
  const userData = {
    username: "@philip.jr",
    displayName: "Philip Jr",
    initials: "PJ",
    email: "philip.jr@example.com",
    joinDate: "January 2024",
    bio: "Entertainment enthusiast and prediction master. Always staying ahead of the trends!",
    avatar: null,
  };

  // Mock stats
  const stats = {
    totalPredictions: 26,
    wins: 23,
    losses: 3,
    winRate: 87,
    totalEarned: 1500,
    totalStaked: 120,
    profit: 1380,
    currentStreak: 8,
    bestStreak: 12,
    rank: 1,
  };

  // Mock activity
  const activities = [
    {
      id: "1",
      type: "prediction" as const,
      action: "Won" as const,
      market: "Will Wizkid's new single hit 5M streams in week 1?",
      amount: 2.74,
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "prediction" as const,
      action: "Placed" as const,
      market: "Will Burna Boy drop an album in Q4 2024?",
      amount: 5.0,
      timestamp: "1 day ago",
    },
    {
      id: "3",
      type: "prediction" as const,
      action: "Won" as const,
      market: "Will Davido collaborate with a major US artist this year?",
      amount: 9.23,
      timestamp: "3 days ago",
    },
    {
      id: "4",
      type: "achievement" as const,
      action: "Unlocked" as const,
      achievement: "Win Streak Master",
      timestamp: "1 week ago",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <DashboardNav />
      <div className="pt-16 flex">
        <DashboardSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
          {/* Profile Header */}
          <ProfileHeader user={userData} stats={stats} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-[#1E293B] border-[#334155]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ProfileStats stats={stats} />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <ProfileActivity activities={activities} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <ProfileSettings user={userData} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

