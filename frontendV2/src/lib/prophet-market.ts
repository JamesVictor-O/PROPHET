/** On-chain market row mapped for list / card UI */
export interface ProphetMarket {
  /** Market contract address (checksummed) — used in routes and Trade modal */
  id: string;
  title: string;
  category: string;
  /** Placeholder YES % until AMM / MM quotes exist on-chain */
  price: number;
  change: number;
  volume: string;
  /** Raw USDT collateral in 6-decimal bigint — used for aggregate volume math */
  rawCollateral: bigint;
  closeDate: string;
  /** From MarketStatus when loaded from chain */
  chainStatus?: string;
}
