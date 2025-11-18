"use client";

import { LeaderboardUser } from "@/app/dashboard/leaderboard/page";
import { cn } from "@/lib/utils";

interface LeaderboardEntryProps {
  user: LeaderboardUser;
}

export function LeaderboardEntry({ user }: LeaderboardEntryProps) {
  return (
    <div className="p-3 sm:p-4 md:p-6 hover:bg-[#0F172A] transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400 w-6 sm:w-7 md:w-8 shrink-0">
            {user.rank}
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gray-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs sm:text-sm md:text-base">
              {user.initials}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base truncate">
              {user.displayName}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 truncate">
              {user.username}
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 shrink-0">
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
            <div className="text-base sm:text-lg font-bold text-green-400">
              ${user.totalEarned.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">earned</div>
          </div>
        </div>

        {/* Tablet View */}
        <div className="hidden md:flex lg:hidden items-center space-x-4 shrink-0">
          <div className="text-center">
            <div className="text-xs font-semibold">{user.wins}</div>
            <div className="text-[10px] text-gray-400">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold">{user.accuracy}%</div>
            <div className="text-[10px] text-gray-400">Acc</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-green-400">
              ${user.totalEarned.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400">earned</div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden text-right shrink-0">
          <div className="text-sm sm:text-base font-bold text-green-400">
            ${user.totalEarned.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400">
            {user.wins} wins • {user.accuracy}%
          </div>
        </div>
      </div>
    </div>
  );
}

