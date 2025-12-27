import { useQuery } from "@tanstack/react-query";
import { graphqlQuery } from "./useGraphQL";

export interface UsernameUpdateGraphQL {
  id: string;
  user: string;
  username: string;
}

export function useUsernameUpdatesGraphQL(userAddress: string | undefined) {
  return useQuery({
    queryKey: ["usernameUpdates", userAddress],
    queryFn: async () => {
      if (!userAddress) return [];

      const query = `
        query {
          ReputationSystem_UsernameSet(limit: 1000) {
            id
            user
            username
          }
        }
      `;

      const data = await graphqlQuery<{
        ReputationSystem_UsernameSet: UsernameUpdateGraphQL[];
      }>(query);

      // Filter by user address (case-insensitive)
      const userUpdates = data.ReputationSystem_UsernameSet.filter(
        (update) => update.user.toLowerCase() === userAddress.toLowerCase()
      );

      // Sort by ID (which includes timestamp) descending to get most recent first
      return userUpdates.sort((a, b) => {
        // ID format is typically "blockNumber-transactionIndex-logIndex"
        // Extract block number for sorting
        const blockA = parseInt(a.id.split("-")[0] || "0");
        const blockB = parseInt(b.id.split("-")[0] || "0");
        return blockB - blockA; // Descending order
      });
    },
    enabled: !!userAddress,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

