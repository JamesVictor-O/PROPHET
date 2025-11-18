"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

interface ProfileHeaderProps {
  user: {
    username: string;
    displayName: string;
    initials: string;
    email: string;
    joinDate: string;
    bio: string;
    avatar?: string | null;
  };
  stats: {
    rank: number;
    winRate: number;
    currentStreak: number;
  };
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  return (
    <Card className="bg-[#1E293B] border-dark-700">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-[#2563EB] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-3xl">{user.initials}</span>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{user.displayName}</h1>
              <div className="flex items-center gap-2">
                {stats.rank <= 3 && (
                  <Badge className="bg-[#2563EB] text-white">
                    <Trophy className="w-3 h-3 mr-1" />
                    Rank #{stats.rank}
                  </Badge>
                )}
                {stats.currentStreak > 0 && (
                  <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                    🔥 {stats.currentStreak} streak
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-gray-400 mb-2">{user.username}</p>
            {user.bio && (
              <p className="text-sm text-gray-400 mb-4">{user.bio}</p>
            )}
            {(user.joinDate || user.email) && (
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {user.joinDate && <span>Joined {user.joinDate}</span>}
                {user.joinDate && user.email && <span>•</span>}
                {user.email && <span>{user.email}</span>}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2563EB] mb-1">
                {stats.winRate}%
              </div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                #{stats.rank}
              </div>
              <div className="text-xs text-gray-400">Rank</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

