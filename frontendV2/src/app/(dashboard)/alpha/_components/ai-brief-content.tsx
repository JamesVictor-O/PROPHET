export function AIBriefContent({
  slug,
  fallbackSummary,
}: {
  slug: string;
  fallbackSummary: string;
}) {
  return (
    <div className="p-4 border border-gray-700 bg-gray-800 rounded text-sm text-gray-300">
      AI Brief: {fallbackSummary}
    </div>
  );
}
