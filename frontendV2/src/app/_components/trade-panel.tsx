export default function TradePanel({
  marketAddress,
  marketYesPct,
}: {
  marketAddress?: string;
  marketYesPct: number;
}) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white">
      Trade Panel (Mock) - {marketYesPct}%
    </div>
  );
}
