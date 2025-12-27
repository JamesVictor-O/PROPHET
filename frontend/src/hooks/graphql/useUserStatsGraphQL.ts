import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { graphqlQuery } from "./useGraphQL";
import { formatEther } from "viem";

export interface UserStatsGraphQL {
  totalPredictions: bigint;
  correctPredictions: bigint;
  totalWinnings: bigint;
  currentStreak: bigint;
  bestStreak: bigint;
  reputationScore: bigint;
  totalStaked: bigint;
}

export function useUserStatsGraphQL(userAddress?: string) {
  const { address } = useAccount();
  const addressToUse = userAddress || address;

  return useQuery({
    queryKey: ["userStats", addressToUse],
    queryFn: async (): Promise<UserStatsGraphQL | null> => {
      if (!addressToUse) return null;

      const query = `
        query {
          User(id: "${addressToUse.toLowerCase()}") {
            id
            address
            username
            totalPredictions
            correctPredictions
            totalWinnings
            currentStreak
            bestStreak
            reputationScore
            totalStaked
          }
        }
      `;

      const data = await graphqlQuery<{ User: any }>(query);

      if (!data.User) {
        // Return default stats if user not found
        return {
          totalPredictions: 0n,
          correctPredictions: 0n,
          totalWinnings: 0n,
          currentStreak: 0n,
          bestStreak: 0n,
          reputationScore: 0n,
          totalStaked: 0n,
        };
      }

      return {
        totalPredictions: BigInt(data.User.totalPredictions || "0"),
        correctPredictions: BigInt(data.User.correctPredictions || "0"),
        totalWinnings: BigInt(data.User.totalWinnings || "0"),
        currentStreak: BigInt(data.User.currentStreak || "0"),
        bestStreak: BigInt(data.User.bestStreak || "0"),
        reputationScore: BigInt(data.User.reputationScore || "0"),
        totalStaked: BigInt(data.User.totalStaked || "0"),
      };
    },
    enabled: !!addressToUse,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}


