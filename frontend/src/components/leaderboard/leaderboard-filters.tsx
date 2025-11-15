"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeaderboardFiltersProps {
  timeFilter: "all" | "month" | "week";
  categoryFilter: string;
  onTimeFilterChange: (filter: "all" | "month" | "week") => void;
  onCategoryFilterChange: (filter: string) => void;
}

export function LeaderboardFilters({
  timeFilter,
  categoryFilter,
  onTimeFilterChange,
  onCategoryFilterChange,
}: LeaderboardFiltersProps) {
  const timeFilters = [
    { id: "all" as const, label: "All Time" },
    { id: "month" as const, label: "This Month" },
    { id: "week" as const, label: "This Week" },
  ];

  const categories = ["All", "Music", "Movies", "Reality TV", "Awards"];

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Time Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {timeFilters.map((filter) => (
          <Button
            key={filter.id}
            onClick={() => onTimeFilterChange(filter.id)}
            variant={timeFilter === filter.id ? "default" : "outline"}
            className={cn(
              "whitespace-nowrap",
              timeFilter === filter.id
                ? "bg-[#2563EB] text-white"
                : "bg-[#1E293B] border-[#334155] text-gray-400 hover:bg-[#334155]"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => onCategoryFilterChange(category.toLowerCase())}
            variant={categoryFilter === category.toLowerCase() ? "default" : "outline"}
            className={cn(
              "whitespace-nowrap",
              categoryFilter === category.toLowerCase()
                ? "bg-[#2563EB] text-white"
                : "bg-[#1E293B] border-[#334155] text-gray-400 hover:bg-[#334155]"
            )}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}

