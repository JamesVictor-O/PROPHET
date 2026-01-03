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
        query GetUsernameUpdates($user: String!) {
          ReputationSystem_UsernameSet(where: {user: {_eq: $user}}, limit: 100) {
            id
            user
            username
          }
        }
      `;

      const data = await graphqlQuery<{
        ReputationSystem_UsernameSet: UsernameUpdateGraphQL[];
      }>(query, { user: userAddress.toLowerCase() });

      return data.ReputationSystem_UsernameSet || [];
    },
    enabled: !!userAddress,
    staleTime: 15000,
    refetchInterval: 30000,
  });
}
