export const MARKET_STATUS_COLOR: Record<string, string> = {
  Pending: "#fbbf24",
  Open: "#7B6EF4",
  Resolving: "#f87171",
  Challenged: "#f87171",
  Resolved: "#34d399",
  Cancelled: "#6b7280",
  Archived: "#4b5563",
};

export function marketStatusColor(status?: string | null): string {
  return MARKET_STATUS_COLOR[status ?? ""] ?? "#9ca3af";
}

export function marketStatusTone(status?: string | null) {
  const color = marketStatusColor(status);
  return {
    color,
    background: `${color}18`,
    border: `${color}33`,
  };
}
