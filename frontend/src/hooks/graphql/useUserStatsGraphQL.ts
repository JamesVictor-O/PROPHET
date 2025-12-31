import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { graphqlQuery } from "./useGraphQL";

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

      interface UserGraphQLResponse {
        id: string;
        address: string;
        username: string | null;
        totalPredictions: string;
        correctPredictions: string;
        totalWinnings: string;
        currentStreak: string;
        bestStreak: string;
        reputationScore: string;
        totalStaked: string;
      }

      const data = await graphqlQuery<{ User: UserGraphQLResponse | null }>(
        query
      );

      if (!data.User) {
        // Return default stats if user not found
        return {
          totalPredictions: BigInt(0),
          correctPredictions: BigInt(0),
          totalWinnings: BigInt(0),
          currentStreak: BigInt(0),
          bestStreak: BigInt(0),
          reputationScore: BigInt(0),
          totalStaked: BigInt(0),
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
    staleTime: 30000, 
    refetchInterval: 60000,
  });
}
