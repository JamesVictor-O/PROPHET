const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;

if (!pimlicoKey) {
  throw new Error("Pimlico API key is not set");
}

interface GasPriceResponse {
  slow: {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
  standard: {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
  fast: {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
}

export const pimlicoClient = (chainId: number) => {
  const rpcUrl = `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`;

  return {
    async getUserOperationGasPrice(): Promise<GasPriceResponse> {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "pimlico_getUserOperationGasPrice",
          params: [],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Pimlico gas price error: ${data.error.message}`);
      }

      const result = data.result;

      return {
        slow: {
          maxFeePerGas: BigInt(result.slow.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(result.slow.maxPriorityFeePerGas),
        },
        standard: {
          maxFeePerGas: BigInt(result.standard.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(result.standard.maxPriorityFeePerGas),
        },
        fast: {
          maxFeePerGas: BigInt(result.fast.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(result.fast.maxPriorityFeePerGas),
        },
      };
    },
  };
};
