import { useQuery } from "@tanstack/react-query";
import {
  fetchGraphQL,
  GET_MARKETS,
  GET_USER_PREDICTIONS,
  GET_GLOBAL_ACTIVITY,
} from "@/services/envio";
import { useAccount } from "wagmi";

export interface EnvioMarket {
  id: string;
  question: string;
  category: string;
  creator: string;
  totalPool: string;
  yesPool: string;
  noPool: string;
  status: string;
  resolved: boolean;
  endTime: string;
  createdAt: string;
}

export function useEnvioMarkets() {
  return useQuery({
    queryKey: ["envio-markets"],
    queryFn: () =>
      fetchGraphQL(GET_MARKETS) as Promise<{ Market: EnvioMarket[] }>,
    refetchInterval: 5000, // Poll every 5 seconds for "real-time" feel without WebSockets
  });
}

export function useEnvioUserPredictions() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["envio-user-predictions", address],
    queryFn: () =>
      fetchGraphQL(GET_USER_PREDICTIONS, { user: address?.toLowerCase() }),
    enabled: !!address,
    refetchInterval: 5000,
  });
}

export function useEnvioActivity() {
  return useQuery({
    queryKey: ["envio-activity"],
    queryFn: () => fetchGraphQL(GET_GLOBAL_ACTIVITY),
    refetchInterval: 5000,
  });
}
