"use client";

import { LeaderboardUser } from "@/app/dashboard/leaderboard/page";
import { cn } from "@/lib/utils";

interface LeaderboardEntryProps {
  user: LeaderboardUser;
}

export function LeaderboardEntry({ user }: LeaderboardEntryProps) {
  return (
    <div className="p-6 hover:bg-[#0F172A] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-gray-400 w-8">
            {user.rank}
          </div>
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{user.initials}</span>
          </div>
          <div>
            <div className="font-semibold">{user.displayName}</div>
            <div className="text-sm text-gray-400">{user.username}</div>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <div className="text-center">
            <div className="text-sm font-semibold">{user.wins}</div>
            <div className="text-xs text-gray-400">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold">{user.accuracy}%</div>
            <div className="text-xs text-gray-400">Accuracy</div>
          </div>
          {user.winStreak > 0 && (
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-400">
                🔥 {user.winStreak}
              </div>
              <div className="text-xs text-gray-400">Streak</div>
            </div>
          )}
          <div className="text-right">
            <div className="text-lg font-bold text-green-400">
              ${user.totalEarned.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">earned</div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden text-right">
          <div className="text-lg font-bold text-green-400">
            ${user.totalEarned.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">
            {user.wins} wins • {user.accuracy}% accuracy
          </div>
        </div>
      </div>
    </div>
  );
}

