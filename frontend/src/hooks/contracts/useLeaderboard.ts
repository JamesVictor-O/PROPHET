

import { useMemo } from "react";
import { Address } from "viem";
import { formatEther } from "viem";
import { useTopUsers, useUserStats, useUsername } from "./useReputationSystem";

export interface LeaderboardEntry {
  rank: number;
  address: Address;
  username: string;
  initials: string;
  wins: number;
  accuracy: number;
  earned: string;
  reputationScore: bigint;
}


function generateInitials(username: string, address: Address): string {
  let initials = "";
  if (username && username.length > 0) {
    // Remove @ and special chars, split by space or underscore
    const cleanUsername = username
      .replace("@", "")
      .replace(/[^a-zA-Z0-9]/g, " ");
    const parts = cleanUsername.split(" ").filter((p) => p.length > 0);

    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      initials = parts[0]
        .substring(0, 2)
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
    } else if (cleanUsername.length >= 2) {
      initials = cleanUsername
        .substring(0, 2)
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
    }
  }

  // Fallback to address initials if no username
  if (initials.length < 2) {
    const addrStr = address.slice(2, 6).toUpperCase();
    initials = addrStr || "??";
  }

  return initials;
}

/**
 * Helper function to format username
 */
function formatUsername(username: string, address: Address): string {
  if (username && username.length > 0) {
    return username.startsWith("@") ? username : `@${username}`;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get leaderboard entries with stats and usernames
 * @param limit Number of entries to fetch (default: 10, max: 10)
 */
export function useLeaderboard(limit: number = 10) {
  // Limit to max 10 for performance
  const actualLimit = Math.min(limit, 10);
  const {
    data: topUsers,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useTopUsers(actualLimit);

  // Fetch stats and usernames for each top user (up to 10)
  // We need to call hooks individually for React rules
  const stats1 = useUserStats(topUsers?.[0]);
  const stats2 = useUserStats(topUsers?.[1]);
  const stats3 = useUserStats(topUsers?.[2]);
  const stats4 = useUserStats(topUsers?.[3]);
  const stats5 = useUserStats(topUsers?.[4]);
  const stats6 = useUserStats(topUsers?.[5]);
  const stats7 = useUserStats(topUsers?.[6]);
  const stats8 = useUserStats(topUsers?.[7]);
  const stats9 = useUserStats(topUsers?.[8]);
  const stats10 = useUserStats(topUsers?.[9]);

  const username1 = useUsername(topUsers?.[0]);
  const username2 = useUsername(topUsers?.[1]);
  const username3 = useUsername(topUsers?.[2]);
  const username4 = useUsername(topUsers?.[3]);
  const username5 = useUsername(topUsers?.[4]);
  const username6 = useUsername(topUsers?.[5]);
  const username7 = useUsername(topUsers?.[6]);
  const username8 = useUsername(topUsers?.[7]);
  const username9 = useUsername(topUsers?.[8]);
  const username10 = useUsername(topUsers?.[9]);

  const statsQueries = [
    stats1,
    stats2,
    stats3,
    stats4,
    stats5,
    stats6,
    stats7,
    stats8,
    stats9,
    stats10,
  ];
  const usernameQueries = [
    username1,
    username2,
    username3,
    username4,
    username5,
    username6,
    username7,
    username8,
    username9,
    username10,
  ];

  const isLoadingStats = statsQueries.some((query) => query.isLoading);
  const isLoadingUsernames = usernameQueries.some((query) => query.isLoading);
  const isLoading = isLoadingUsers || isLoadingStats || isLoadingUsernames;

  const isError = isErrorUsers || statsQueries.some((query) => query.isError);

  // Extract data arrays first to satisfy React Compiler
  const statsData = useMemo(
    () => [
      stats1.data,
      stats2.data,
      stats3.data,
      stats4.data,
      stats5.data,
      stats6.data,
      stats7.data,
      stats8.data,
      stats9.data,
      stats10.data,
    ],
    [
      stats1.data,
      stats2.data,
      stats3.data,
      stats4.data,
      stats5.data,
      stats6.data,
      stats7.data,
      stats8.data,
      stats9.data,
      stats10.data,
    ]
  );

  const usernamesData = useMemo(
    () => [
      username1.data || "",
      username2.data || "",
      username3.data || "",
      username4.data || "",
      username5.data || "",
      username6.data || "",
      username7.data || "",
      username8.data || "",
      username9.data || "",
      username10.data || "",
    ],
    [
      username1.data,
      username2.data,
      username3.data,
      username4.data,
      username5.data,
      username6.data,
      username7.data,
      username8.data,
      username9.data,
      username10.data,
    ]
  );

  // Combine data into leaderboard entries
  const entries: LeaderboardEntry[] = useMemo(() => {
    if (!topUsers || topUsers.length === 0) return [];

    return topUsers.slice(0, actualLimit).map((address, index) => {
      const stats = statsData[index];
      const username = usernamesData[index];

      // Calculate accuracy
      const accuracy =
        stats && stats.totalPredictions > 0
          ? Number(
              (stats.correctPredictions * BigInt(100)) / stats.totalPredictions
            )
          : 0;

      // Get wins (correct predictions)
      const wins = stats ? Number(stats.correctPredictions) : 0;

      // Format winnings
      const earned =
        stats && stats.totalWinnings > 0
          ? `$${Number(formatEther(stats.totalWinnings)).toFixed(2)}`
          : "$0.00";

      const initials = generateInitials(username, address);
      const displayUsername = formatUsername(username, address);

      return {
        rank: index + 1,
        address,
        username: displayUsername,
        initials,
        wins,
        accuracy,
        earned,
        reputationScore: stats?.reputationScore || BigInt(0),
      };
    });
  }, [topUsers, statsData, usernamesData, actualLimit]);

  return {
    data: entries,
    isLoading,
    isError,
  };
}
