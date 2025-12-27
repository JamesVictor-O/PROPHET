import { useQuery } from "@tanstack/react-query";
import { graphqlQuery } from "./useGraphQL";
import { formatEther } from "viem";

export interface LeaderboardUserGraphQL {
  id: string;
  address: string;
  username: string | null;
  totalPredictions: string;
  correctPredictions: string;
  totalWinnings: string;
  currentStreak: string;
  bestStreak: string;
  reputationScore: string;
}

export interface LeaderboardEntryGraphQL {
  rank: number;
  address: string;
  username: string;
  displayName: string;
  initials: string;
  wins: number;
  accuracy: number;
  totalEarned: number;
  winStreak: number;
  reputationScore: bigint;
}

function generateInitials(username: string | null, address: string): string {
  if (username && username.length > 0) {
    const parts = username.replace("@", "").split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }
  return address.slice(2, 4).toUpperCase();
}

function formatUsername(username: string | null, address: string): string {
  if (username) {
    return username.startsWith("@") ? username : `@${username}`;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDisplayName(username: string | null, address: string): string {
  if (username) {
    return username
      .replace("@", "")
      .split(".")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function useLeaderboardGraphQL(limit: number = 100) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async () => {
      const query = `
        query {
          User(limit: ${limit}, orderBy: reputationScore, orderDirection: desc) {
            id
            address
            username
            totalPredictions
            correctPredictions
            totalWinnings
            currentStreak
            bestStreak
            reputationScore
          }
        }
      `;

      const data = await graphqlQuery<{ User: LeaderboardUserGraphQL[] }>(query);

      // Transform to leaderboard format
      const entries: LeaderboardEntryGraphQL[] = data.User.map((user, index) => {
        const totalPredictions = BigInt(user.totalPredictions || "0");
        const correctPredictions = BigInt(user.correctPredictions || "0");
        const wins = Number(correctPredictions);
        const accuracy =
          totalPredictions > 0n
            ? Number((correctPredictions * 100n) / totalPredictions)
            : 0;
        const totalEarned = Number(formatEther(BigInt(user.totalWinnings || "0")));
        const winStreak = Number(user.currentStreak || "0");

        return {
          rank: index + 1,
          address: user.address,
          username: formatUsername(user.username, user.address),
          displayName: formatDisplayName(user.username, user.address),
          initials: generateInitials(user.username, user.address),
          wins,
          accuracy,
          totalEarned,
          winStreak,
          reputationScore: BigInt(user.reputationScore || "0"),
        };
      });

      return entries;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

